import pandas as pd
from flask import Flask, render_template, request, jsonify
from datetime import timedelta
import json

import numpy as np
import pandas as pd
import random

app = Flask(__name__)
app.jinja_env.auto_reload = True
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = timedelta(seconds = 0)

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
        singleSequence = i - timePoint
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
    heatmap = pd.read_csv("heatmapProbMatrix.csv", index_col=0)
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

@app.route('/heatmap/', methods = ['GET', 'POST'])
def postheatmap():
    return Heatmap()

@app.route('/timetrans/', methods = ['GET', 'POST'])
def timetrans():
    timeScale = request.get_json()["scale"]
    return TimeData(timeScale)

@app.route('/nodelist/', methods = ['GET', 'POST'])
def getlist():
    getListName = request.get_json()["name"]
    # print(getListName)
    return NodeList(getListName)

@app.route('/MCCdict/', methods = ['GET', 'POST'])
def getMCCdict():
    MCCdict_get = pd.read_csv("mcc_codes.csv")
    MCCdict = MCCdict_get.to_json(orient = "records")
    # print(MCCdict)
    return MCCdict


if __name__ == '__main__': 
    app.run() 