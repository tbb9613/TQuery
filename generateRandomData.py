import numpy as np
import pandas as pd
import random


a = []
matrix = []

locList = ["Surpermarket", "Cafe", "Restaurant", "School", "Pharmacy", "Theatre", "Cinema"]

for j in range(len(locList)):
    prob = 1
    a = []
    for i in range(len(locList)):
        if i != len(locList)-1:
            num = 0.16 * (i+1) *  np.random.rand()
            indprob = num * prob
            a.append(indprob)
            prob = prob - indprob
        else:
            a.append(prob)
    matrix.append(a)

# print(matrix)
probMatrix = pd.DataFrame(matrix, columns = locList, index = locList)
# print(probMatrix)
# print(probMatrix.loc[station].to_list())

allRoute = []
routeLenth = 7
for j in range(3):
    for location in locList:
        station = location
        route = []
        route.append(station)
        for i in range(routeLenth-1):
            # print(station)
            probList = probMatrix.loc[station].to_list()
            station = np.random.choice(locList, 1, p=probList)[0]
            route.append(station)
        allRoute.append(route)

route = pd.DataFrame(allRoute)
# print(route.head())

# Choose time
timePoint = 3

nodeList = route.iloc[:,timePoint].value_counts().index.to_list()
print(nodeList) #Node List

typeMCC = "Cinema" #Choose Node

MCCQueryRoute = route[route.iloc[:,timePoint] == typeMCC] #Query
print(MCCQueryRoute)
print("lenth: ", len(MCCQueryRoute))

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
nodeMap = pd.DataFrame(data=nodeData)
# nodeMap["size"] = 1
print(nodeMap.head())
print("***********")
#Reduce dumplication and calculate size

linkList = []

for seq in nodeMap["sequence"].unique():    
#     "seq = ", seq, "\n", 
    linkCount = nodeMap[nodeMap["sequence"] == seq]["links"].value_counts()
    idcounter = 0
    for link, count in linkCount.items():        
        linkList.append([seq,link[0],link[1],count,idcounter])
        idcounter += 1
        

newNodeMap = pd.DataFrame(linkList, columns=["sequence", "source","target", "count", "id"])
print(newNodeMap)

newNodeMap.to_csv("sequenceData1.csv")

