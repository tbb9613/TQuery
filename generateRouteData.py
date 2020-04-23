import numpy as np
import pandas as pd
import random


a = []
# b = []
matrix = []
heatmapMatrix = []

locList = ["Surpermarket", "Cafe", "Restaurant", "School", "Pharmacy", "Theatre", "Cinema"]

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

print(heatmapMatrix)
probMatrix = pd.DataFrame(matrix, columns = locList, index = locList)
heatmapProbMatrix = pd.DataFrame(heatmapMatrix, columns=["place1", "place2", "prob"])
print(heatmapProbMatrix.head())
probMatrix.to_csv("probMatrix.csv")
heatmapProbMatrix.to_csv("heatmapProbMatrix.csv")
# print(probMatrix.loc[station].to_list())

allRoute = []
routeLenth = 11
for j in range(6):
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
route.to_csv("route.csv")