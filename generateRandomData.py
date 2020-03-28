import numpy as np
import pandas as pd
import random

location = []
individual = []
spending = []
time = []


for i in range(5):
    loc = []
    t = []
    loc = np.random.choice(range(20), 10, replace=False)
    for items in loc:
        location.append(items)
    t = np.random.choice(range(15), 10, replace=False)
    for items in t:
        time.append(items)
    for j in range(10):
        spending.append(np.random.randint(5,100))
        individual.append(i)

#
# df = pd.DataFrame({'location':location, 'invidual':individual, 'time':time, 'spending':spending})
# print(df)
# df.to_csv('fakedata.csv',index = False)

a = []
matrix = []

for j in range(5):
    prob = 1
    a = []
    for i in range(5):
        if i != 4:
            num = 0.5 * np.random.rand()
            indprob = num * prob
            a.append(indprob)
            prob = prob - indprob
        else:
            a.append(prob)
    matrix.append(a)

print(matrix)