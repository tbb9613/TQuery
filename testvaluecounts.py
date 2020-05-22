import pandas as pd
from datetime import datetime
import numpy as np

route = pd.read_csv("route.csv",index_col=0)
multiQueryLinks = pd.read_json("testmultilink.json", orient='records')
multiQueryNodes = pd.read_json("testmultinode.json", orient='records')
# print(multiQueryNodes)
querySeries = []
for node in multiQueryNodes["id"]:
    thisSeries = []
    thisTypeList = []
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

print(querySeries)
# querySeries = ["Restaurant", "Restaurant"]
# print(querySeries)
timePoint = 3
for subSeries in querySeries:
    maskDirected = (route.iloc[:,timePoint:timePoint+len(subSeries)] == subSeries).all(axis=1)
    MCCQueryRoute = route[maskDirected] #Query
    print(subSeries)
    print(MCCQueryRoute.head())





def queryNode_pack(time):
    route = pd.read_csv("route.csv",index_col=0)
    querySeries = ["Restaurant", "Cinema"]
    timePoint = time

    MCCQueryRoute = route[route.iloc[:,timePoint] == querySeries] #Query

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

def generateTimeSeries():
    date_rng = pd.date_range(start='4/30/2020', end='5/1/2020', freq='5min')
    # dfgb = df.groupby(['sequence','source']).count().reset_index().rename(columns = {'target': 'valueCount'}).drop(columns = ['count', 'id',"sequence","Unnamed: 0"])
    df = pd.DataFrame(date_rng, columns=['date'])
    df['total_transaction'] = np.random.randint(5000,10000,size=(len(date_rng)))
    df['avg_transaction'] = np.random.randint(500,1000,size=(len(date_rng)))
    df.to_csv("timeseries_day.csv")