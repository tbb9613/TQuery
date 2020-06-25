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