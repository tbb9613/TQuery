import numpy as np
import pandas as pd
import random
import itertools


a = []
# b = []
matrix = []
heatmapMatrix = []

locList = ["Grocery Stores, Supermarkets", "Bakeries", "Fast Food Restaurants", "Furniture, Home Furnishings, and Equipment Stores, ExceptAppliances", "Drug Stores and Pharmacies", "Book Stores", "Motor Freight Carriers, Moving and Storage Companies, Trucking – Local/Long Distance, Delivery Services – Local"]

for j in range(len(locList)):
    prob = 1
    a = []
    b = []
    for i in range(len(locList)):
        if i != len(locList)-1:
            num = 0.16 * (i+1) *  np.random.rand()
            indprob = num * prob
            a.append(indprob)
            heatmapMatrix.append([locList[i], locList[j], indprob])
            prob = prob - indprob
        else:
            a.append(prob)
            heatmapMatrix.append([locList[i], locList[j], prob])
    matrix.append(a)
    # heatmapMatrix.append(b)

# print(heatmapMatrix)
probMatrix = pd.DataFrame(matrix, columns = locList, index = locList)
heatmapProbMatrix = pd.DataFrame(heatmapMatrix, columns=["place1", "place2", "prob"])
# print(heatmapProbMatrix.head())

probMatrix.to_csv("probMatrix.csv")
heatmapProbMatrix.to_csv("heatmapProbMatrix.csv")
# print(probMatrix.loc[station].to_list())

allRoute = []
routeLenth = 11
for j in range(routeLenth-1):
    for location in locList:
        station = location
        route = []
        route.append(station)
        route.append(np.random.randint(1, high=200)) #time interval
        route.append(np.random.randint(10, high=80)) #transaction val
        for i in range(routeLenth-1):
            # print(station)
            probList = probMatrix.loc[station].to_list()
            station = np.random.choice(locList, 1, p=probList)[0]
            route.append(station)
            route.append(np.random.randint(1, high=200)) #time interval
            route.append(np.random.randint(10, high=80)) #transaction val
        allRoute.append(route)
print(range(10))
headr = list(itertools.product(list(range(routeLenth)), ["mcc", "time_interval", "transaction_value"]))
print(headr)
cols = pd.MultiIndex.from_tuples(headr)
print(len(allRoute))
route = pd.DataFrame(allRoute, columns = cols)
# route.to_json("route_1.json", orient="records")
print(route.head())




def QuerySingleNode_new(startTime, endTime, queryMCC, single_sequence, time_interval_limit, keep_rank_num, last_step_routes):
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
    data_query_route.set_index("name", inplace = True)
    data_query_route["offset"] = alignment_offset
    data_query_route["step"] = data_query_route["step"] + data_query_route["offset"]
    shaped_routes = data_query_route.pivot(index = data_query_route.index, columns =  "step")
    #calculate absolute step pos
    raw_step = single_sequence + left_alignment_pos
    #last step targets

    if single_sequence > 0:
        source_step = raw_step-1
        target_step = raw_step
        #filter the data by time interval
        filtered_routes = shaped_routes[(shaped_routes["time_interval_to_next"][source_step] < time_interval_limit) & (shaped_routes["time_interval_from_last"][target_step] < time_interval_limit)]
        links = filtered_routes["mcc"][[source_step,target_step]].rename(columns = {source_step:"source", target_step:"target"})
    elif single_sequence < 0:
        source_step = raw_step+1
        target_step = raw_step
        filtered_routes = shaped_routes[(shaped_routes["time_interval_to_next"][target_step] < time_interval_limit) & (shaped_routes["time_interval_from_last"][source_step] < time_interval_limit)]
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
    nodes_g["route"] = links.groupby(["target"]).groups.values()
    # filter: node count >0
    nodes_g = nodes_g[nodes_g["count"] > 0].reset_index(drop=True)
    # group to deal with transaction type
    nodes_transtype_groupby = links[columns_transaction_type].drop(columns = ["source"]).groupby(by = ["target", "transaction_type"])
    nodes_transtype = nodes_transtype_groupby.count().dropna()
    # get routes from diff transaction types
    nodes_transtype["type_routes"] = nodes_transtype_groupby.groups.values()
    nodes_transtype_cnt = nodes_transtype.unstack()["transaction_value"].reset_index(drop=True)
    nodes_transtype_routes = nodes_transtype.unstack()["type_routes"].reset_index(drop=True)
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
    nodes_result["offline_route"] = nodes_result["offline_route"].apply(lambda x: x.tolist())
    nodes_result["online_route"] = nodes_result["online_route"].apply(lambda x: x.tolist())
    # get routes of top nodes 
    this_step_routes = []
    for routes in nodes_result["route"]:
        this_step_routes += routes
    # get all links in this step's route
    links = links[links.index.isin(this_step_routes)]
    # get links grouped into source + target + count format df
    links_g = links.reset_index().groupby(["source","target"]).count().dropna().rename(columns = {"name":"count"}).reset_index()
    # capture links' routes by people's identifier/name
    links_g["route"] = links.groupby(["source","target"]).groups.values()
    # add atv column
    links_g["atv"] = links.groupby(["source","target"]).mean().reset_index().dropna()["transaction_value"]
    links_transtype_groupby = links[columns_transaction_type].groupby(by = ["source", "target", "transaction_type"])
    links_transtype = links_transtype_groupby.count().dropna()
    # group to deal with transaction type
    links_transtype["type_routes"] = links_transtype_groupby.groups.values()
    links_transtype_cnt = links_transtype.unstack()["transaction_value"].reset_index(drop=True)
    links_transtype_routes = links_transtype.unstack()["type_routes"].reset_index(drop=True)
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
    links_result["offline_route"] = links_result["offline_route"].apply(lambda x: x.tolist())
    links_result["online_route"] = links_result["online_route"].apply(lambda x: x.tolist())

    links_result_dict = links_result.to_dict('records')
    nodes_result_dict = nodes_result.to_dict('records')
    return jsonify(link = links_result_dict, node = nodes_result_dict, route_list = this_step_routes)