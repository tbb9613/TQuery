import pandas as pd

df = pd.read_csv("sequenceData1.csv")

dfgb = df.groupby(['sequence','source']).count().reset_index().rename(columns = {'target': 'valueCount'}).drop(columns = ['count', 'id',"sequence","Unnamed: 0"])


print(dfgb)