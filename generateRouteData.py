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
route.to_csv("route.csv")