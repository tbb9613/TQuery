import pandas as pd
from flask import Flask, render_template, request, jsonify
from datetime import timedelta
import json
import numpy as np
import pandas as pd
import random
import itertools

app = Flask(__name__)
app.jinja_env.auto_reload = True
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = timedelta(seconds = 0)

pd.options.mode.chained_assignment = None

#read data and change data type
record_with_tinterval = pd.read_csv("data/data_example.csv", index_col = 0)
# record_with_tinterval["mcc"] = record_with_tinterval["mcc"].astype("category")
# record_with_tinterval["transaction_type"] = record_with_tinterval["transaction_type"].astype("category")
record_with_tinterval["time"] =  pd.to_datetime(record_with_tinterval["time"])
record_with_tinterval["time_interval_to_next"] =  pd.to_timedelta(record_with_tinterval["time_interval_to_next"])
record_with_tinterval["time_interval_from_last"] =  pd.to_timedelta(record_with_tinterval["time_interval_from_last"])
# time_range_filtered = None
shaped_routes = None
left_alignment_pos = None
# data_query_route = None
total_sta = None

def QueryTimeFilter(startTime, endTime, queryMCC):
    global shaped_routes, left_alignment_pos, total_sta
    time_range_filtered = record_with_tinterval[(record_with_tinterval["time"] > startTime) & (record_with_tinterval["time"] < endTime)]
    time_range_filtered["step"] = time_range_filtered.groupby(["name"])["time"].rank().astype(int)
    #get largest min "max first position" of the queried MCC in the route as the left alignment position
    data_mcc_query = time_range_filtered.loc[time_range_filtered["mcc"] == queryMCC]
    grouped_data_query = data_mcc_query.groupby("name")
    left_alignment_pos = grouped_data_query["step"].min().max()
    need_alignment = grouped_data_query["step"].min().dropna() < left_alignment_pos
    #calcu alignment offset
    alignment_offset = left_alignment_pos - grouped_data_query["step"].min().dropna()
    data_query_route = time_range_filtered[time_range_filtered["name"].isin(need_alignment.index)]
    
    #get total_sta
    total_sta = data_query_route.groupby("mcc").mean().drop(columns = ["step"]).rename({"transaction_value": "avg_atv"}, axis = 1)
    total_sta["total_ttv"] = data_query_route.groupby("mcc").sum()["transaction_value"]
    total_sta["offline_total_ttv"] = data_query_route.groupby(["mcc", "transaction_type"]).sum().unstack().xs(("transaction_value", "offline"), axis = 1)
    total_sta["online_total_ttv"] = data_query_route.groupby(["mcc", "transaction_type"]).sum().unstack().xs(("transaction_value", "online"), axis = 1)
    total_sta["offline_avg_atv"] = data_query_route.groupby(["mcc", "transaction_type"]).mean().unstack().xs(("transaction_value", "offline"), axis = 1)
    total_sta["online_avg_atv"] = data_query_route.groupby(["mcc", "transaction_type"]).mean().unstack().xs(("transaction_value", "online"), axis = 1)   

    data_query_route.set_index("name", inplace = True)
    data_query_route["offset"] = alignment_offset
    data_query_route["step"] = data_query_route["step"] + data_query_route["offset"]
    shaped_routes = data_query_route.pivot(index = data_query_route.index, columns =  "step") 

def QuerySingleNode_new(single_sequence, time_interval_limit, keep_rank_num, last_step_routes):

    raw_step = single_sequence + left_alignment_pos
    #last step targets
    if single_sequence > 0:
        source_step = raw_step-1
        target_step = raw_step
        #filter the data by time interval
        filtered_routes = shaped_routes[(shaped_routes["time_interval_to_next"][source_step] < time_interval_limit) & (shaped_routes["time_interval_from_last"][target_step] < time_interval_limit)]
    elif single_sequence < 0:
        source_step = raw_step+1
        target_step = raw_step
        filtered_routes = shaped_routes[(shaped_routes["time_interval_to_next"][target_step] < time_interval_limit) & (shaped_routes["time_interval_from_last"][source_step] < time_interval_limit)]
    else:
        source_step = raw_step+1
        target_step = raw_step
        filtered_routes = shaped_routes
    links = filtered_routes["mcc"][[source_step,target_step]].rename(columns = {source_step:"source", target_step:"target"})
    #filter links into last step routes, then all the sources should be same as last steps' target
    if abs(single_sequence) > 1:
        links = links[links.index.isin(last_step_routes)]
    # add transaction value column
    links["transaction_value"] = filtered_routes.xs(("transaction_value", target_step), axis=1)
    links["transaction_type"] = filtered_routes.xs(("transaction_type", target_step), axis=1)
    links["merchant"] = filtered_routes.xs(("merchant", target_step), axis=1)
    # column lists that use later
    columns_transaction_type = ["source", "target", "transaction_type", "transaction_value"]
    columns_transaction_value = ["target", "transaction_value"]
    # get nodes grouped
    nodes_g = links[columns_transaction_value].groupby(["target"]).count().rename(columns = {"transaction_value":"count"}).reset_index()
    # capture nodes' route
    nodes_g["route"] = list(links[columns_transaction_value].groupby(["target"]).groups.values())
    # filter: node count >0
    nodes_g = nodes_g[nodes_g["count"] > 0].reset_index(drop=True)
    # group to deal with transaction type
    nodes_transtype_groupby = links[columns_transaction_type].drop(columns = ["source"]).groupby(by = ["target", "transaction_type"])
    nodes_transtype = nodes_transtype_groupby.count().dropna()
    # get routes from diff transaction types
    nodes_transtype["type_routes"] = list(nodes_transtype_groupby.groups.values())
    nodes_transtype_cnt = nodes_transtype.unstack()["transaction_value"].reset_index().sort_values(by = ["target"]).reset_index(drop=True)
    nodes_transtype_routes = nodes_transtype.unstack()["type_routes"].reset_index().sort_values(by = ["target"]).reset_index(drop=True)
    # add trans type count
    nodes_g["offline_count"] = nodes_transtype_cnt["offline"]
    nodes_g["online_count"] = nodes_transtype_cnt["online"]
    # add trans type trajectory id
    nodes_g["offline_route"] = nodes_transtype_routes["offline"]
    nodes_g["online_route"] = nodes_transtype_routes["online"]
    #add atv
    nodes_g["atv"] = links.groupby(["target"]).mean().dropna()["transaction_value"].reset_index(drop=True)
    # get largest X results
    nodes_result = nodes_g.nlargest(keep_rank_num, "count").reset_index(drop=True)
    # convert array to list - for jsonify
    nodes_result["route"] = nodes_result["route"].apply(lambda x: x.tolist())
    nodes_result["sequence"] = single_sequence
    for row in nodes_result.loc[nodes_result["offline_route"].isna(), "offline_route"].index:
        nodes_result.at[row, "offline_route"] = np.array([])
    for row in nodes_result.loc[nodes_result["online_route"].isna(), "online_route"].index:
        nodes_result.at[row, "online_route"] = np.array([])
    nodes_result["offline_count"].fillna(0, inplace = True)
    nodes_result["online_count"].fillna(0, inplace = True)
    nodes_result["offline_route"] = nodes_result["offline_route"].apply(lambda x: x.tolist())
    nodes_result["online_route"] = nodes_result["online_route"].apply(lambda x: x.tolist())
    
    if single_sequence != 0 :
        # get routes of top nodes 
        this_step_routes = []
        for routes in nodes_result["route"]:
            this_step_routes += routes
        # get all links in this step's route
        links = links[links.index.isin(this_step_routes)]
        # get links grouped into source + target + count format df
        links_g = links.groupby(["source","target"]).count().rename(columns = {"merchant":"count"}).reset_index().dropna()
        # capture links' routes by people's identifier/name
        links_g["route"] = list(links.groupby(["source","target"]).groups.values())
        # add atv column
        links_g["atv"] = links[["source", "target", "transaction_value"]].groupby(["source","target"]).mean().dropna().reset_index()["transaction_value"]
        links_transtype_groupby = links[columns_transaction_type].groupby(by = ["source", "target", "transaction_type"])
        links_transtype = links_transtype_groupby.count().dropna()
        # group to deal with transaction type
        links_transtype["type_routes"] = list(links_transtype_groupby.groups.values())
        links_transtype_cnt = links_transtype.unstack()["transaction_value"].reset_index().sort_values(by = ["source", "target"]).reset_index()
        links_transtype_routes = links_transtype.unstack()["type_routes"].reset_index().sort_values(by = ["source", "target"]).reset_index()
        # add trans type count
        links_g["offline_count"] = links_transtype_cnt["offline"]
        links_g["online_count"] = links_transtype_cnt["online"]
        # add trans type traj id
        links_g["offline_route"] = links_transtype_routes["offline"]
        links_g["online_route"] = links_transtype_routes["online"]
        # generate results
        links_result = links_g.reset_index(drop = True).drop(columns = ["transaction_value"])
        links_result["sequence"] = single_sequence
        # convert array to list
        links_result["route"] = links_result["route"].apply(lambda x: x.tolist())
        #fill null list
        for row in links_result.loc[links_result["offline_route"].isna(), "offline_route"].index:
            links_result.at[row, "offline_route"] = np.array([])
        for row in links_result.loc[links_result["online_route"].isna(), "online_route"].index:
            links_result.at[row, "online_route"] = np.array([])
        links_result["offline_count"].fillna(0, inplace = True)
        links_result["online_count"].fillna(0, inplace = True)
        links_result["offline_route"] = links_result["offline_route"].apply(lambda x: x.tolist())
        links_result["online_route"] = links_result["online_route"].apply(lambda x: x.tolist())

        links_result_dict = links_result.to_dict('records')
        nodes_result_dict = nodes_result.to_dict('records')
        if abs(single_sequence) > 1 :
            return jsonify(link = links_result_dict, node = nodes_result_dict, route_list = this_step_routes)
        else:
            total_sta_dict = total_sta.reset_index().to_dict('records')
            return jsonify(link = links_result_dict, node = nodes_result_dict, route_list = this_step_routes, total_sta = total_sta_dict)
    else:
        nodes_result_dict = nodes_result.to_dict('records')
        return jsonify(node = nodes_result_dict)

def packQueryListCovert(packLinks, packNodes):
    
    multiQueryLinks = pd.DataFrame(packLinks)
    multiQueryNodes = pd.DataFrame(packNodes)
    # print(multiQueryLinks)

    querySeries = []
    for node in multiQueryNodes["id"]:
        thisSeries = []
        thisTypeList = []
        #if it is an independant node
        if (~(multiQueryLinks["source"].eq(node).any()) & ~(multiQueryLinks["target"].eq(node).any())):
            # print(node)
            querySeries.append([node])
        #if the node is the start of a link
        elif (multiQueryLinks["source"].eq(node).any() & ~(multiQueryLinks["target"].eq(node).any())):
            thisSeries.append(node)
            #get the target
            lastTarget = multiQueryLinks[multiQueryLinks["source"] == node]["target"].values[0]
            thisSeries.append(lastTarget)
            #get type
            thisTypeList.append(multiQueryLinks[multiQueryLinks["source"] == node]["type"].values[0])
            # print(lastTarget)
            # if the target is another source
            while multiQueryLinks["source"].eq(lastTarget).any():
                thisTypeList.append(multiQueryLinks[multiQueryLinks["source"] == lastTarget]["type"].values[0])
                lastTarget = multiQueryLinks[multiQueryLinks["source"] == lastTarget]["target"].values[0]
                thisSeries.append(lastTarget)
                # thisTypeList.append)
            #get unique values of type list
            thisTypeList = list(set(thisTypeList))
            #if directed + undirected
            if len(thisTypeList)>1: 
                querySeries.append(thisSeries)
            else:
                if thisTypeList == ["directed"]:
                    querySeries.append(thisSeries)
                elif thisTypeList == ["undirected"]:
                    querySeries.append(thisSeries)
                    # add a reversed list
                    querySeries.append(list(reversed(thisSeries)))
    # print(querySeries)
    return querySeries

#ToDo: optimize this
def PackedQuery(startTime, endTime, allList, single_sequence, time_interval_limit, keep_rank_num, last_step_routes):
    prime_num = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293]
    left_alignment_group = []
    unique_length = pd.DataFrame(columns = ["pack_length"])
    all_index = np.array([])
    time_range_filtered = record_with_tinterval[(record_with_tinterval["time"] > startTime) & (record_with_tinterval["time"] < endTime)]
    time_range_filtered["step"] = time_range_filtered.groupby(["name"])["time"].rank().astype(int)
    time_range_filtered_cpy = time_range_filtered.copy()
    for j in range(len(allList)):
        # print(j)
        time_range_filtered_cpy = time_range_filtered_cpy[~time_range_filtered_cpy.isin(all_index)]
        #define kernel
        kernel = []
        id_list = []
        queryList = allList[j]
        print(queryList)
        for i in range(len(queryList)):
            if i == 0:
                mcc_id_transform = (time_range_filtered_cpy["mcc"]==queryList[i])*prime_num[i]
            else:
                mcc_id_transform +=(time_range_filtered_cpy["mcc"]==queryList[i])*prime_num[i]
            kernel.append(prime_num[i] * prime_num[i]) # kernel = id^2
            id_list.append(prime_num[i])

        time_range_filtered_cpy["transform"] = mcc_id_transform
        id_list.reverse()
        kernel.reverse()
        # so if id = [2,3], kernel = [4,9], using square of prime numbers to make sure the convolution is unique
        # filter all the last step in the querylist by matching convolve result. eg. two mccs -> [2,3] dot [4,9] = 35
        time_range_filtered_cpy["pattern"] = list(np.convolve(mcc_id_transform, kernel,"full") == np.dot(id_list,kernel))[:-len(queryList)+1] # as using full mode, the convolve return would be longer than the df
        packed_data_query = time_range_filtered_cpy[(time_range_filtered_cpy["pattern"]) & (time_range_filtered_cpy["step"]>len(queryList)-1)] # avoid all the 
        grouped_packed_data_query = packed_data_query.groupby("name")
        step_group = grouped_packed_data_query["step"].min().dropna()
        left_alignment_pos_this = step_group.max()
        left_alignment_group.append(left_alignment_pos_this)
        # record length
        unique_this = pd.DataFrame(grouped_packed_data_query["step"].min().dropna())
        unique_this["pack_length"] = len(queryList)
        packed_data_query_route_this = time_range_filtered[time_range_filtered["name"].isin(step_group.index)]
        packed_data_query_route_this.set_index("name", inplace = True)
        alignment_offset = left_alignment_pos_this - grouped_packed_data_query["step"].min().dropna()
        packed_data_query_route_this["offset"] = alignment_offset
        packed_data_query_route_this["alignment_pos"] = left_alignment_pos_this
        if j == 0:
            unique_length = unique_this
            all_index = list(step_group.index)
            # print(j, all_index)
            packed_data_query_route = packed_data_query_route_this
        else:
            unique_length = unique_length.append(unique_this)
            this_index = list(step_group.index)
            all_index += this_index
            # print(j, this_index, all_index)
            packed_data_query_route = packed_data_query_route.append(packed_data_query_route_this)
    #get total sta
    data_query_route = packed_data_query_route.reset_index(drop=True)
    p_total_sta = data_query_route.groupby("mcc").mean().drop(columns = ["step", "offset", "alignment_pos"]).rename({"transaction_value": "avg_atv"}, axis = 1)
    p_total_sta["total_ttv"] = data_query_route.groupby("mcc").sum()["transaction_value"]
    p_total_sta["offline_total_ttv"] = data_query_route.groupby(["mcc", "transaction_type"]).sum().unstack().xs(("transaction_value", "offline"), axis = 1)
    p_total_sta["online_total_ttv"] = data_query_route.groupby(["mcc", "transaction_type"]).sum().unstack().xs(("transaction_value", "online"), axis = 1)
    p_total_sta["offline_avg_atv"] = data_query_route.groupby(["mcc", "transaction_type"]).mean().unstack().xs(("transaction_value", "offline"), axis = 1)
    p_total_sta["online_avg_atv"] = data_query_route.groupby(["mcc", "transaction_type"]).mean().unstack().xs(("transaction_value", "online"), axis = 1)   
    # find max alignment position
    max_alignment_pos = packed_data_query_route["alignment_pos"].max()
    packed_data_query_route["alignment_pos_max"] = max_alignment_pos
    packed_data_query_route["offset"] += (packed_data_query_route["alignment_pos_max"] - packed_data_query_route["alignment_pos"])
    # take max left alignment pos
    # packed_data_query_route.set_index("name", inplace = True)
    packed_data_query_route["step"] += packed_data_query_route["offset"]
    packed_data_query_route.drop(columns = ["offset", "alignment_pos", "alignment_pos_max"], inplace= True)
    # print(packed_data_query_route.index)
    shaped_routes_packed = packed_data_query_route.pivot(index = packed_data_query_route.index, columns =  "step")
    shaped_routes_packed["pack_length"] = unique_length["pack_length"]
    
    #calculate step pos in the data
    raw_step = single_sequence + max_alignment_pos

    if single_sequence > 0:
        source_step = raw_step-1
        target_step = raw_step
        #filter the data by time interval
        filtered_routes = shaped_routes_packed[(shaped_routes_packed["time_interval_to_next"][source_step] < time_interval_limit) & (shaped_routes_packed["time_interval_from_last"][target_step] < time_interval_limit)]
        links = filtered_routes["mcc"][[source_step,target_step]].rename(columns = {source_step:"source", target_step:"target"})
        # add transaction value column
        links["transaction_value"] = filtered_routes.xs(("transaction_value", target_step), axis=1)
        links["transaction_type"] = filtered_routes.xs(("transaction_type", target_step), axis=1)
        links["merchant"] = filtered_routes.xs(("merchant", target_step), axis=1)
    elif single_sequence < 0:
        #when go left, because the alignment is conducted with the last stop in the query list
        counter = 0
        for pack_length in shaped_routes_packed["pack_length"].unique():
            source_step = raw_step+1-(pack_length-1)
            target_step = raw_step-(pack_length-1)
            shaped_this_pack = shaped_routes_packed[shaped_routes_packed["pack_length"] == pack_length]
            filtered_routes_this = shaped_this_pack[(shaped_this_pack["time_interval_to_next"][target_step] < time_interval_limit) & (shaped_this_pack["time_interval_from_last"][source_step] < time_interval_limit)]
            links_this = filtered_routes_this["mcc"][[source_step,target_step]].rename(columns = {source_step:"source", target_step:"target"})
            links_this["transaction_value"] = filtered_routes_this.xs(("transaction_value", target_step), axis=1)
            links_this["transaction_type"] = filtered_routes_this.xs(("transaction_type", target_step), axis=1)
            links_this["merchant"] = filtered_routes_this.xs(("merchant", target_step), axis=1)
            if counter == 0:
                links = links_this
            else:
                links = links.append(links_this)
            counter += 1
    #filter links into last step routes, then all the sources should be same as last steps' target
    if abs(single_sequence) > 1:
        links = links[links.index.isin(last_step_routes)]
        
    # add transaction value column
        # column lists that use later
    columns_transaction_type = ["source", "target", "transaction_type", "transaction_value"]
    columns_transaction_value = ["target", "transaction_value"]
    # get nodes grouped
    nodes_g = links[columns_transaction_value].groupby(["target"]).count().rename(columns = {"transaction_value":"count"}).reset_index()
    # capture nodes' route
    nodes_g["route"] = list(links[columns_transaction_value].groupby(["target"]).groups.values())
    # filter: node count >0
    nodes_g = nodes_g[nodes_g["count"] > 0].reset_index(drop=True)
    # group to deal with transaction type
    nodes_transtype_groupby = links[columns_transaction_type].drop(columns = ["source"]).groupby(by = ["target", "transaction_type"])
    nodes_transtype = nodes_transtype_groupby.count().dropna()
    # get routes from diff transaction types
    nodes_transtype["type_routes"] = list(nodes_transtype_groupby.groups.values())
    nodes_transtype_cnt = nodes_transtype.unstack()["transaction_value"].reset_index().sort_values(by = ["target"]).reset_index(drop=True)
    nodes_transtype_routes = nodes_transtype.unstack()["type_routes"].reset_index().sort_values(by = ["target"]).reset_index(drop=True)
    # add trans type count
    nodes_g["offline_count"] = nodes_transtype_cnt["offline"]
    nodes_g["online_count"] = nodes_transtype_cnt["online"]
    # add trans type trajectory id
    nodes_g["offline_route"] = nodes_transtype_routes["offline"]
    nodes_g["online_route"] = nodes_transtype_routes["online"]
    #add atv
    nodes_g["atv"] = links.groupby(["target"]).mean().dropna()["transaction_value"].reset_index(drop=True)
    # get largest X results
    nodes_result = nodes_g.nlargest(keep_rank_num, "count").reset_index(drop=True)
    # convert array to list - for jsonify
    nodes_result["route"] = nodes_result["route"].apply(lambda x: x.tolist())
    nodes_result["sequence"] = single_sequence
    for row in nodes_result.loc[nodes_result["offline_route"].isna(), "offline_route"].index:
        nodes_result.at[row, "offline_route"] = np.array([])
    for row in nodes_result.loc[nodes_result["online_route"].isna(), "online_route"].index:
        nodes_result.at[row, "online_route"] = np.array([])
    nodes_result["offline_count"].fillna(0, inplace = True)
    nodes_result["online_count"].fillna(0, inplace = True)
    nodes_result["offline_route"] = nodes_result["offline_route"].apply(lambda x: x.tolist())
    nodes_result["online_route"] = nodes_result["online_route"].apply(lambda x: x.tolist())
    # get routes of top nodes 
    this_step_routes = []
    for routes in nodes_result["route"]:
        this_step_routes += routes
    # get all links in this step's route
    links = links[links.index.isin(this_step_routes)]
    # get links grouped into source + target + count format df
    links_g = links.groupby(["source","target"]).count().rename(columns = {"merchant":"count"}).reset_index().dropna()
    # capture links' routes by people's identifier/name
    links_g["route"] = list(links.groupby(["source","target"]).groups.values())
    # add atv column
    links_g["atv"] = links[["source", "target", "transaction_value"]].groupby(["source","target"]).mean().dropna().reset_index()["transaction_value"]
    links_transtype_groupby = links[columns_transaction_type].groupby(by = ["source", "target", "transaction_type"])
    links_transtype = links_transtype_groupby.count().dropna()
    # group to deal with transaction type
    links_transtype["type_routes"] = list(links_transtype_groupby.groups.values())
    links_transtype_cnt = links_transtype.unstack()["transaction_value"].reset_index().sort_values(by = ["source", "target"]).reset_index()
    links_transtype_routes = links_transtype.unstack()["type_routes"].reset_index().sort_values(by = ["source", "target"]).reset_index()
    # add trans type count
    links_g["offline_count"] = links_transtype_cnt["offline"]
    links_g["online_count"] = links_transtype_cnt["online"]
    # add trans type traj id
    links_g["offline_route"] = links_transtype_routes["offline"]
    links_g["online_route"] = links_transtype_routes["online"]
    # generate results
    links_result = links_g.reset_index(drop = True).drop(columns = ["transaction_value"])
    
    # convert array to list
    links_result["route"] = links_result["route"].apply(lambda x: x.tolist())
    links_result["sequence"] = single_sequence
    #fill null list
    for row in links_result.loc[links_result["offline_route"].isna(), "offline_route"].index:
        links_result.at[row, "offline_route"] = np.array([])
    for row in links_result.loc[links_result["online_route"].isna(), "online_route"].index:
        links_result.at[row, "online_route"] = np.array([])
    links_result["offline_count"].fillna(0, inplace = True)
    links_result["online_count"].fillna(0, inplace = True)
    links_result["offline_route"] = links_result["offline_route"].apply(lambda x: x.tolist())
    links_result["online_route"] = links_result["online_route"].apply(lambda x: x.tolist())

    links_result_dict = links_result.to_dict('records')
    nodes_result_dict = nodes_result.to_dict('records')
    p_total_sta_dict = p_total_sta.reset_index().to_dict('records')
    return jsonify(link = links_result_dict, node = nodes_result_dict, route_list = this_step_routes, total_sta = p_total_sta_dict)

def QueryProperty(startTime, endTime, queryMCC, route_list, query_property, single_sequence):
    #calculate absolute step pos
    raw_step = single_sequence + left_alignment_pos
    query_property_list = [query_property, "transaction_value"]
    # get merchant&transaction Series with specified route
    merchant_series = shaped_routes[shaped_routes.index.isin(route_list)].xs((query_property, raw_step), axis = 1)
    tv_series = shaped_routes[shaped_routes.index.isin(route_list)].xs(("transaction_value", raw_step), axis = 1)
    # concat to a dataframe
    merchant_raw = pd.concat([merchant_series, tv_series], axis = 1).droplevel(1, axis=1)
    # using groupby to get result
    merchant_groupby = merchant_raw.groupby(["merchant"])
    merchant_g = merchant_groupby.count().rename(columns = {"transaction_value": "count"})
    merchant_g["transaction_value"] = merchant_groupby.sum()
    merchant_g["route"] = list(merchant_groupby.groups.values())
    merchant_g["route"] = merchant_g["route"].apply(lambda x: x.tolist())
    merchant_g = merchant_g.reset_index()
    return merchant_g.to_json(orient = "records")

def SingleRoute(single_route_list, single_sequence_list):
    # single_route_list = ["people111", "people2006", "people335", "people578"]
    # single_sequence_list = [-1,0,1]

    raw_sequence_list = list(map(lambda x:x+left_alignment_pos,single_sequence_list))
    shaped_routes_filtered = shaped_routes[shaped_routes.index.isin(single_route_list)]
    # for step in single_sequence_list:
    atv = shaped_routes_filtered["transaction_value"][raw_sequence_list].mean().rename("atv")
    time_interval = shaped_routes_filtered["time_interval_to_next"][raw_sequence_list].mean().rename("time_interval_to_next")
    mcc = shaped_routes_filtered["mcc"][raw_sequence_list].T.iloc[:,0]
    ttv = shaped_routes_filtered["transaction_value"][raw_sequence_list].sum()
    single_route_analysis = pd.concat([atv, time_interval], axis = 1)
    single_route_analysis["ttv"] = ttv
    single_route_analysis["sequence"] = single_sequence_list
    single_route_analysis["mcc"] = mcc

    single_route_analysis = single_route_analysis.reset_index(drop = True)
    return single_route_analysis.to_json(orient = "records")

def Heatmap():
    # heatmap = pd.read_csv("heatmapProbMatrix copy.csv", index_col=0)
    record_with_tinterval_cpy = record_with_tinterval.copy()
    # make a "next station" column
    record_with_tinterval_cpy["next_station"] = record_with_tinterval_cpy["mcc"].shift(-1)
    # delete every ppl's last "next_station" since it is another one's first one
    record_with_tinterval_cpy.loc[record_with_tinterval_cpy.groupby("name").tail(1).index, "next_station"] = np.nan
    large_index = record_with_tinterval_cpy[["mcc", "next_station", "name"]].dropna().groupby(["mcc"]).count().nlargest(8, "name").index
    filtered_records = record_with_tinterval_cpy[record_with_tinterval_cpy["mcc"].isin(large_index)]
    nxt_station_g = filtered_records[["mcc", "next_station", "name"]].dropna().groupby(["mcc", "next_station"]).count().reset_index().rename(columns = {"name": "count"})
    nxt_station_allcnt = nxt_station_g.groupby("mcc").agg({"count":"sum"}).reset_index()
    nxt_station_prob = nxt_station_g.merge(nxt_station_allcnt, how = "outer", on = "mcc")
    nxt_station_prob["prob"] = nxt_station_prob["count_x"]/nxt_station_prob["count_y"]
    nxt_station_prob.rename(columns = {"mcc":"place1", "next_station":"place2"},inplace=True)
    nxt_station_prob.drop(columns = ["count_x", "count_y"], inplace = True)
    heatmapSend = nxt_station_prob.to_dict(orient = "records")
    linked_count = nxt_station_allcnt.to_dict(orient = "records")
    # print(heatmapSend)
    return jsonify(heatmap = heatmapSend, linked_count = linked_count)

def TimeData(timeScale):
    fileName = "data/timeseries_"+str(timeScale)+".csv"
    timeTrans_read = pd.read_csv(fileName).drop(columns = ["Unnamed: 0"])
    # print(timeTrans_read.head())
    timeTrans = timeTrans_read.to_json(orient = "records")
    # print(timeTrans)
    return timeTrans

def NodeList(listName):
    all_mcc_list = list(record_with_tinterval["mcc"].unique())
    top_mcc_list = list(record_with_tinterval.groupby(["mcc"]).count().nlargest(5, "name").index)
    cnt = record_with_tinterval.groupby(["mcc"]).count()["name"].rename("count")
    atv = record_with_tinterval.groupby(["mcc"]).mean()["transaction_value"].rename("atv")
    all_list = pd.concat([cnt, atv], axis = 1).reset_index()
    listdict = { "Location": all_list,
                "Industry": all_list, 
                "MCC": all_list }
    if listdict.__contains__(listName):
        return listdict[listName].to_json(orient = "records")
    else:
        return listdict["MCC"].to_json(orient = "records")

@app.route('/', methods=['GET','POST'])
def index():
        return render_template("GraphDemo1.html")

@app.route('/query_packed/', methods=['GET','POST'])
def QueryPacked():
    datagetjson = request.get_json(force=True)
    packLinks = datagetjson['links'][0]
    packNodes = datagetjson['nodes']
    start_time = pd.Timestamp(datagetjson["timeStart"])
    end_time = pd.Timestamp(datagetjson["timeEnd"])
    time_interval_limit = pd.offsets.Minute(999)
    last_step_routes = datagetjson['list']
    rank_num = datagetjson['displaynum'] #max display num
    single_seq = datagetjson['sequence']
    # print(datagetjson, getName, getTime)
    all_list = packQueryListCovert(packLinks, packNodes)
    # print(QueryNodeMapOut)
    return PackedQuery(start_time, end_time, all_list, single_seq, time_interval_limit, rank_num, last_step_routes)

@app.route('/query_single_new', methods=['GET','POST'])
def QuerySingleNew():
    datagetjson = request.get_json(force=True)
    start_time = pd.Timestamp(datagetjson["timeStart"])
    end_time = pd.Timestamp(datagetjson["timeEnd"])
    time_interval_limit = pd.offsets.Minute(datagetjson["timeInterval"])
    last_step_routes = datagetjson['list']
    rank_num = datagetjson['displaynum'] #max display num
    mcc_name = datagetjson['name'] #querynode
    single_seq = datagetjson['sequence']
    first_flag = datagetjson['firstQuery']
    if first_flag:
        QueryTimeFilter(start_time, end_time, mcc_name)
        return QuerySingleNode_new(single_seq, time_interval_limit, rank_num, last_step_routes)
    else:
    # rank_num = datagetjson['maxshow']
        return QuerySingleNode_new(single_seq, time_interval_limit, rank_num, last_step_routes)

@app.route('/query_property', methods = ['GET', 'POST'])
def QueryPty():
    datagetjson = request.get_json(force=True)
    start_time = pd.Timestamp(datagetjson["timeStart"])
    end_time = pd.Timestamp(datagetjson["timeEnd"])
    mcc_name = datagetjson['name']
    routes = datagetjson['route']
    query_property = "merchant"
    single_sequence = datagetjson['sequence']
    return QueryProperty(start_time, end_time, mcc_name, routes, query_property, single_sequence)

@app.route('/query_route', methods = ['GET', 'POST'])
def QuerySingleTraj():
    datagetjson = request.get_json(force=True)
    route_list = datagetjson['route_list']
    sequence_list = datagetjson['sequence_list']
    return SingleRoute(route_list, sequence_list)

@app.route('/heatmap', methods = ['GET', 'POST'])
def postheatmap():
    return Heatmap()

@app.route('/timetrans', methods = ['GET', 'POST'])
def timetrans():
    timeScale = request.get_json()["scale"]
    return TimeData(timeScale)

@app.route('/nodelist', methods = ['GET', 'POST'])
def getlist():
    getListName = request.get_json()["name"]
    # print(getListName)
    return NodeList(getListName)

@app.route('/MCCdict', methods = ['GET', 'POST'])
def getMCCdict():
    MCCdict_get = pd.read_csv("data/mcc_codes.csv")
    MCCdict = MCCdict_get.to_json(orient = "records")
    # print(MCCdict)
    return MCCdict

if __name__ == '__main__': 
    app.run() 
