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
record_with_tinterval = pd.read_csv("data_example_short_with_type.csv", index_col = 0)
# record_with_tinterval["mcc"] = record_with_tinterval["mcc"].astype("category")
# record_with_tinterval["transaction_type"] = record_with_tinterval["transaction_type"].astype("category")
record_with_tinterval["time"] =  pd.to_datetime(record_with_tinterval["time"])
record_with_tinterval["time_interval_to_next"] =  pd.to_timedelta(record_with_tinterval["time_interval_to_next"])
record_with_tinterval["time_interval_from_last"] =  pd.to_timedelta(record_with_tinterval["time_interval_from_last"])

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
    nodes_g["route"] = links[columns_transaction_value].groupby(["target"]).groups.values()
    # filter: node count >0
    nodes_g = nodes_g[nodes_g["count"] > 0].reset_index(drop=True)
    # group to deal with transaction type
    nodes_transtype_groupby = links[columns_transaction_type].drop(columns = ["source"]).groupby(by = ["target", "transaction_type"])
    nodes_transtype = nodes_transtype_groupby.count().dropna()
    # get routes from diff transaction types
    nodes_transtype["type_routes"] = list(nodes_transtype_groupby.groups.values())
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
    print(len(links))
    links = links[links.index.isin(this_step_routes)]
    print(len(links))
    # get links grouped into source + target + count format df
    links_g = links.reset_index().groupby(["source","target"]).count().dropna().rename(columns = {"name":"count"}).reset_index()
    # capture links' routes by people's identifier/name
    links_g["route"] = links.groupby(["source","target"]).groups.values()
    # add atv column
    links_g["atv"] = links[["source", "target", "transaction_value"]].groupby(["source","target"]).mean().dropna().reset_index()["transaction_value"]
    links_transtype_groupby = links[columns_transaction_type].groupby(by = ["source", "target", "transaction_type"])
    links_transtype = links_transtype_groupby.count().dropna()
    # print(links_transtype)
    # print(links_transtype_groupby.groups)
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
    # print(links_result)
    # print(links_result["offline_route"].isna())
    
    # convert array to list
    links_result["route"] = links_result["route"].apply(lambda x: x.tolist())
    #fill null list
    for row in links_result.loc[links_result["offline_route"].isna(), "offline_route"].index:
        links_result.at[row, "offline_route"] = np.array([])
    for row in links_result.loc[links_result["online_route"].isna(), "online_route"].index:
        links_result.at[row, "online_route"] = np.array([])
    links_result["offline_count"].fillna(0, inplace = True)
    links_result["online_count"].fillna(0, inplace = True)
    allroute = []
    allroutetype = []
    for rows in links_result.iterrows():
        print(rows)
    links_result["offline_route"] = links_result["offline_route"].apply(lambda x: x.tolist())
    links_result["online_route"] = links_result["online_route"].apply(lambda x: x.tolist())

    links_result_dict = links_result.to_dict('records')
    nodes_result_dict = nodes_result.to_dict('records')
    return jsonify(link = links_result_dict, node = nodes_result_dict, route_list = this_step_routes)

def queryNode_single(typeMCC, time):
    route = pd.read_csv("route.csv",index_col=0)

    timePoint = time

    MCCQueryRoute = route[route.iloc[:,timePoint] == typeMCC] #Query

    #Generate primary source-target dataframe
    source = []
    target = []
    sequence = []
    nodeName = []
    routeID = []
    # nodeLocation = []
    nodeSequence = []
    routeGroup = []
    lrouteGroup = []
    # ids = []

    for i in range(len(MCCQueryRoute.columns)):
        singleSequence = i - timePoint #the number of sequence: eg. -4 / 4
        # print(MCCQueryRoute.iloc[:,i].index)
        if singleSequence != 0:
            for j in MCCQueryRoute.iloc[:,i].index:
                routeID.append(j)
                sequence.append(singleSequence)
                # ids.append(j+1)
            for location in MCCQueryRoute.iloc[:,i]:
                target.append(str(singleSequence) + location)
                nodeName.append(location)
                nodeSequence.append(singleSequence)
            if singleSequence < 0:
                for location in MCCQueryRoute.iloc[:,i+1]:
                    source.append(str(singleSequence+1) + location)
            else:
                for location in MCCQueryRoute.iloc[:,i-1]:
                    source.append(str(singleSequence-1) + location)
        else: #if this node is start node
            source.append(str(singleSequence) + typeMCC)
            target.append(str(singleSequence) + typeMCC)
            sequence.append(singleSequence)
            nodeName.append(location)
            nodeSequence.append(singleSequence)
            routeID.append("start")
            # ids.append(0)

    # print(np.unique(target))

    linkData = {"links":zip(source, target), "sequence":sequence}
    nodeData = {"links":zip(source, target), "target": target,"place":nodeName, "sequence":nodeSequence, "route": routeID}
    # print(len(source-target), len(sequence), len(ids))

    nodeMap = pd.DataFrame(data=linkData).sort_values(by = ['links'])
    nodeSelf = pd.DataFrame(data=nodeData).sort_values(by = ['target']).reset_index(drop=True)
    nodeSelf_m = nodeSelf
    for t in nodeSelf['target'].unique():
        routeSubGroup = []
        # print(nodeSelf.groupby(["target"]).get_group(t))
        for rname in nodeSelf.groupby(["target"]).get_group(t)['route']:
            routeSubGroup.append(rname)
        routeGroup.append(routeSubGroup)

    nodeSelf = nodeSelf.drop_duplicates(["target"])
    nodeSelf["route"] = routeGroup
    nodeSelf['atv'] = np.random.randint(5,100,size=(len(routeGroup)))

    # print(nodeSelf)

    #Link route
    for t in nodeSelf_m['links'].unique():
        routeSubGroup = []
        # print(nodeSelf.groupby(["links"]).get_group(t))
        for rname in nodeSelf_m.groupby(["links"]).get_group(t)['route']:
            routeSubGroup.append(rname)
        lrouteGroup.append(routeSubGroup)
    nodeSelf_m = nodeSelf_m.drop_duplicates(["links"])
    # print(nodeSelf_m.shape, len(routeSubGroup))
    nodeSelf_m["route"] = lrouteGroup
    # print(nodeSelf_m)

    nodeSelf.drop(columns = "links", inplace = True)
    # nodeSelf_m.drop(columns = "links", inplace = True)

    #Reduce dumplication and calculate size
    linkList = []
    for seq in nodeMap["sequence"].unique():        
        linkCount = nodeMap[nodeMap["sequence"] == seq]["links"].value_counts()
        # idcounter = 0
        for link, count in linkCount.items():        
            linkList.append([seq,link,link[0], count])
            # idcounter += 1
            

    newNodeMap = pd.DataFrame(linkList, columns=["sequence", "links", "source_count", "count"])
    #count different links per node
    countNodeMap = newNodeMap.groupby(['sequence','source_count']).count().reset_index().rename(columns = {'links': 'sublink_count'}).drop(columns = ["count"])
    newNodeMap = pd.merge(newNodeMap, countNodeMap, on = ["source_count", "sequence"])

    # calculated for each source how many links will draw from this source
    sub_id = []
    counter = 0
    subIdCounter = 1
    lastSource = ""
    for source in newNodeMap["source_count"]:
        if counter == 0:
            sub_id.append(subIdCounter)
        else:
            if source == lastSource:
                sub_id.append(subIdCounter)
            else:
                subIdCounter = 1
                sub_id.append(subIdCounter)        
        # print(source, lastSource, subIdCounter)
        lastSource = source
        subIdCounter += 1
        counter += 1
    newNodeMap["sub_id"] = sub_id    

    # newNodeMap_1 = newNodeMap.merge(nodeSelf, on=["target", "sequence"])
    newNodeMap = newNodeMap.merge(nodeSelf_m, on=["links", "sequence"])

    #unzip link
    sourcePair = []
    targetPair = []
    for link in newNodeMap['links']:
        sourcePair.append(link[0])
        targetPair.append(link[1])
    
    newNodeMap["source"] = sourcePair
    newNodeMap["target"] = targetPair
    # print(newNodeMap_1)
    newNodeMap.drop(columns = "links", inplace = True)
    
    QueryLink = newNodeMap.to_dict('records')
    QueryNodeSelf = nodeSelf.to_dict('records')
    return jsonify(link = QueryLink, node = QueryNodeSelf)

def Heatmap():
    heatmap = pd.read_csv("heatmapProbMatrix copy.csv", index_col=0)
    heatmapSend = heatmap.to_json(orient = "records")
    # print(heatmapSend)
    return heatmapSend

def TimeData(timeScale):
    fileName = "timeseries_"+str(timeScale)+".csv"
    timeTrans_read = pd.read_csv(fileName).drop(columns = ["Unnamed: 0"])
    # print(timeTrans_read.head())
    timeTrans = timeTrans_read.to_json(orient = "records")
    # print(timeTrans)
    return timeTrans

def NodeList(listNmae):
    listdict = { "Location": ["Grocery Stores, Supermarkets", "Bakeries", "Fast Food Restaurants", "Furniture, Home Furnishings, and Equipment Stores, ExceptAppliances", "Drug Stores and Pharmacies", "Book Stores", "Motor Freight Carriers, Moving and Storage Companies, Trucking – Local/Long Distance, Delivery Services – Local"],
                "Industry": ["Grocery Stores, Supermarkets", "Bakeries", "Furniture, Home Furnishings, and Equipment Stores, ExceptAppliances", "Drug Stores and Pharmacies", "Book Stores", "Motor Freight Carriers, Moving and Storage Companies, Trucking – Local/Long Distance, Delivery Services – Local"], 
                "MCC": ["Grocery Stores, Supermarkets", "Bakeries", "Fast Food Restaurants", "Furniture, Home Furnishings, and Equipment Stores, ExceptAppliances", "Drug Stores and Pharmacies", "Book Stores", "Motor Freight Carriers, Moving and Storage Companies, Trucking – Local/Long Distance, Delivery Services – Local"]}
    if listdict.__contains__(listNmae):
        return json.dumps(listdict[listNmae])
    else:
        return json.dumps(listdict["MCC"])


@app.route('/', methods=['GET','POST'])
def index():
        return render_template("GraphDemo1.html")

@app.route('/query_single/', methods=['GET','POST'])
def QuerySingle():
    datagetjson = request.get_json(force=True)
    getName = datagetjson['name']
    getTime = datagetjson['time']
    # print(datagetjson, getName, getTime)
    QueryNodeMapOut = queryNode_single(getName, getTime)
    # print(QueryNodeMapOut)
    return QueryNodeMapOut

@app.route('/query_single_new', methods=['GET','POST'])
def QuerySingleNew():
    datagetjson = request.get_json(force=True)

    start_time = pd.Timestamp(datagetjson["timeStart"])
    end_time = pd.Timestamp(datagetjson["timeEnd"])
    time_interval_limit = pd.offsets.Minute(100)
    last_step_routes = datagetjson['list']
    rank_num = datagetjson['displaynum'] #max display num
    mcc_name = datagetjson['name'] #querynode
    single_seq = datagetjson['sequence']
    # rank_num = datagetjson['maxshow']
    return QuerySingleNode_new(start_time, end_time, mcc_name, single_seq, time_interval_limit, rank_num, last_step_routes)

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
    MCCdict_get = pd.read_csv("mcc_codes.csv")
    MCCdict = MCCdict_get.to_json(orient = "records")
    # print(MCCdict)
    return MCCdict


if __name__ == '__main__': 
    app.run(debug=True) 