import pandas as pd
from datetime import datetime
import numpy as np

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
    routeGroup = []
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
    nodeData = {"links":zip(source, target), "target": target,"place":nodeName, "sequence":nodeSequence, "route": routeID}
    # print(len(source-target), len(sequence), len(ids))
    nodeMap = pd.DataFrame(data=linkData).sort_values(by = ['links'])
    nodeSelf = pd.DataFrame(data=nodeData).sort_values(by = ['target']).reset_index(drop=True)
    print(nodeSelf)
    for t in nodeSelf['links'].unique():
        routeSubGroup = []
        print(nodeSelf.groupby(["links"]).get_group(t))
        for rname in nodeSelf.groupby(["links"]).get_group(t)['route']:
            routeSubGroup.append(rname)
        routeGroup.append(routeSubGroup)
    print(nodeSelf.groupby(["links"]))
    # print (len(routeGroup))
    nodeSelf = nodeSelf.drop_duplicates(["links"])
    nodeSelf["route"] = routeGroup
    print(nodeSelf)
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
    
    newNodeMap = newNodeMap.merge(nodeSelf, on=["target", "sequence"])
    # QueryLink = newNodeMap.to_json(orient = "records")
    # QueryNodeSelf = nodeSelf.to_json(orient = "records")

    QueryLink = newNodeMap.to_dict('records')
    QueryNodeSelf = nodeSelf.to_dict('records')
    # returnDict = {"link": QueryLink, "node": QueryNodeSelf}
    # returnthing = ()
    return print(newNodeMap)


queryNode_c("Theatre", 3)

def generateTimeSeries():
    date_rng = pd.date_range(start='4/30/2020', end='5/1/2020', freq='5min')
    # dfgb = df.groupby(['sequence','source']).count().reset_index().rename(columns = {'target': 'valueCount'}).drop(columns = ['count', 'id',"sequence","Unnamed: 0"])
    df = pd.DataFrame(date_rng, columns=['date'])
    df['total_transaction'] = np.random.randint(5000,10000,size=(len(date_rng)))
    df['avg_transaction'] = np.random.randint(500,1000,size=(len(date_rng)))
    df.to_csv("timeseries_day.csv")