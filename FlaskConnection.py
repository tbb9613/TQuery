import pandas as pd
from flask import Flask, render_template, request
import json

import numpy as np
import pandas as pd
import random

locList = ["Surpermarket", "Cafe", "Restaurant", "School", "Pharmacy", "Theatre", "Cinema"]
route = pd.read_csv("route.csv",index_col=0)
print(route.head())
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
QueryNodeMap = newNodeMap[newNodeMap["sequence"].isin([0,1,-1])].to_json(orient = "records")


app = Flask(__name__)
@app.route("/")

def datapost():
    return render_template("GraphDemo1.html", data=QueryNodeMap)

if __name__ == '__main__': #固定写法 程序入口
    app.run(debug = True) #启动一个flask项目