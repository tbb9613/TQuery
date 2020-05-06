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
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = timedelta(seconds = 1)

def queryNode(typeMCC, time):
    # locList = ["Surpermarket", "Cafe", "Restaurant", "School", "Pharmacy", "Theatre", "Cinema"]
    route = pd.read_csv("route.csv",index_col=0)
    # print(route.head())
    # Choose time
    timePoint = time

    # nodeList = route.iloc[:,timePoint].value_counts().index.to_list()

    # typeMCC = "Cafe" #Choose Node

    MCCQueryRoute = route[route.iloc[:,timePoint] == typeMCC] #Query
    # print(MCCQueryRoute)

    #Generate primary source-target dataframe
    source = []
    target = []
    sequence = []
    # ids = []
    for i in range(len(MCCQueryRoute.columns)):
        singleSequence = i - timePoint
        
        if singleSequence != 0:
            for j in range(len(MCCQueryRoute.iloc[:,i])):
                sequence.append(singleSequence)
                # ids.append(j+1)
            for location in MCCQueryRoute.iloc[:,i]:
                target.append(str(singleSequence) + location)
            if singleSequence < 0:
                for location in MCCQueryRoute.iloc[:,i+1]:
                    source.append(str(singleSequence+1) + location)
            else:
                for location in MCCQueryRoute.iloc[:,i-1]:
                    source.append(str(singleSequence-1) + location)
        else:
            source.append(str(singleSequence) + typeMCC)
            target.append(str(singleSequence) + typeMCC)
            sequence.append(singleSequence)
            # ids.append(0)


    nodeData = {"links":zip(source, target), "sequence":sequence}
    # print(len(source-target), len(sequence), len(ids))
    nodeMap = pd.DataFrame(data=nodeData).sort_values(by = ['links'])
    #Reduce dumplication and calculate size
    linkList = []

    for seq in nodeMap["sequence"].unique():        
        linkCount = nodeMap[nodeMap["sequence"] == seq]["links"].value_counts()
        # idcounter = 0
        for link, count in linkCount.items():        
            linkList.append([seq,link[0],link[1],count])
            # idcounter += 1
            

    newNodeMap = pd.DataFrame(linkList, columns=["sequence", "source","target", "count"])
    #count different links per node
    countNodeMap = newNodeMap.groupby(['sequence','source']).count().reset_index().rename(columns = {'target': 'sublink_count'}).drop(columns = ["count"])
    # print(countNodeMap.head())
    newNodeMap = pd.merge(newNodeMap, countNodeMap, on = ["source", "sequence"])
    
    # calculated for each source how many links will draw from this source
    sub_id = []
    counter = 0
    subIdCounter = 1
    lastSource = ""
    for source in newNodeMap["source"]:
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

    newNodeMap.to_csv("sequenceData2.csv")
    # newNodeMap = newNodeMap.reset_index()
    # QueryNodeMap = newNodeMap[newNodeMap["sequence"].isin([0,1,-1])].to_json(orient = "records")
    QueryNodeMap = newNodeMap.to_json(orient = "records")
    return QueryNodeMap

def queryNode_c(typeMCC, time):
    route = pd.read_csv("route.csv",index_col=0)

    timePoint = time

    MCCQueryRoute = route[route.iloc[:,timePoint] == typeMCC] #Query
    # print(MCCQueryRoute.head())

    #Generate primary source-target dataframe
    source = []
    target = []
    sequence = []
    nodeName = []
    routeID = []
    # nodeLocation = []
    nodeSequence = []
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
        else:
            source.append(str(singleSequence) + typeMCC)
            target.append(str(singleSequence) + typeMCC)
            sequence.append(singleSequence)
            nodeName.append(location)
            nodeSequence.append(singleSequence)
            routeID.append("start")
            # ids.append(0)

    # print(np.unique(target))

    linkData = {"links":zip(source, target), "sequence":sequence}
    nodeData = {"target": target,"place":nodeName, "sequence":nodeSequence, "route": routeID}
    # print(len(source-target), len(sequence), len(ids))
    nodeMap = pd.DataFrame(data=linkData).sort_values(by = ['links'])
    nodeSelf = pd.DataFrame(data=nodeData).sort_values(by = ['target']).drop_duplicates(["target"]).reset_index(drop=True)
    
    # print (nodeSelf)

    #Reduce dumplication and calculate size
    linkList = []

    for seq in nodeMap["sequence"].unique():        
        linkCount = nodeMap[nodeMap["sequence"] == seq]["links"].value_counts()
        # idcounter = 0
        for link, count in linkCount.items():        
            linkList.append([seq,link[0],link[1],count])
            # idcounter += 1
            

    newNodeMap = pd.DataFrame(linkList, columns=["sequence", "source","target", "count"])
    #count different links per node
    countNodeMap = newNodeMap.groupby(['sequence','source']).count().reset_index().rename(columns = {'target': 'sublink_count'}).drop(columns = ["count"])
    # print(countNodeMap.head())
    newNodeMap = pd.merge(newNodeMap, countNodeMap, on = ["source", "sequence"])
    # print(newNodeMap.head())
    # calculated for each source how many links will draw from this source
    sub_id = []
    counter = 0
    subIdCounter = 1
    lastSource = ""
    for source in newNodeMap["source"]:
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
    # print(newNodeMap.head())

    # QueryLink = newNodeMap.to_json(orient = "records")
    # QueryNodeSelf = nodeSelf.to_json(orient = "records")

    QueryLink = newNodeMap.to_dict('records')
    QueryNodeSelf = nodeSelf.to_dict('records')
    # returnDict = {"link": QueryLink, "node": QueryNodeSelf}
    # returnthing = ()
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
    listdict = { "Location": ["Restaurant","Surpermarket", "Cafe", "Restaurant", "School", "Theatre", "Cinema","Cafe"],
                "Industry": ["Pharmacy", "Surpermarket", "School", "Theatre", "Cinema","Cafe"], 
                "MCC": ["Surpermarket", "Cafe", "Restaurant", "School", "Pharmacy", "Theatre", "Cinema"]}
    if listdict.__contains__(listNmae):
        return json.dumps(listdict[listNmae])
    else:
        return json.dumps(listdict["MCC"])


@app.route('/', methods=['GET','POST'])
def index():
        return render_template("GraphDemo1.html")

@app.route('/receivedata/', methods=['GET','POST'])
def receive_query_data():
    datagetjson = request.get_json(force=True)
    getName = datagetjson['name']
    getTime = datagetjson['time']
    # print(datagetjson, getName, getTime)
    QueryNodeMapOut = queryNode(getName, getTime)
    # print(QueryNodeMapOut)
    return QueryNodeMapOut

@app.route('/receivedatac/', methods=['GET','POST'])
def receive_query_data_c():
    datagetjson = request.get_json(force=True)
    getName = datagetjson['name']
    getTime = datagetjson['time']
    # print(datagetjson, getName, getTime)
    QueryNodeMapOut = queryNode_c(getName, getTime)
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


if __name__ == '__main__': 
    app.run() 