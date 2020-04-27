import pandas as pd
from datetime import datetime
import numpy as np

df = pd.read_csv("sequenceData1.csv")
date_rng = pd.date_range(start='4/20/2020', end='5/1/2020', freq='H')
# dfgb = df.groupby(['sequence','source']).count().reset_index().rename(columns = {'target': 'valueCount'}).drop(columns = ['count', 'id',"sequence","Unnamed: 0"])
df = pd.DataFrame(date_rng, columns=['date'])
df['data'] = np.random.randint(5000,10000,size=(len(date_rng)))
df.to_csv("timeseries.csv")
# df.head(15)
# df = pd.read_csv("timeseries.csv").drop(columns = ["Unnamed: 0"])
# selector = df[(df["date"] > "2019-06-01") & (df["date"] < "2019-07-01 21:00:01")]

# print(selector)