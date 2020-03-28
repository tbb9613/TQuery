from flask import Flask, render_template, request
import pymysql # 连接数据库

# hello world
# 创建应用
# web应用
app = Flask(__name__)

# 写一个function 处理浏览器发送的请求

#路由： 通过浏览器访问过来的请求交给谁处理
# @app.route("/")  #当访问 127.0.0.1:5000->定位到计算机   ｜   /-> 默认执行函数
# def index():
#     # 处理业务逻辑
#     return "hello" #返回的数据-> 响应
#
# @app.route("/page1")
# def page1():
#     return "pg1"
#
# @app.route("/")
# def index():
#     return render_template("Hello.html") #此时会自动找templates文件夹里的Hello.html

# 模板-> html
# 新建文件夹 叫"templates"

#把一个变量发送到页面

# @app.route("/")
# def index():
#     # 字符串
#     s = "this is a char"
#     #列表 传一堆数据
#     aList = ["a","b","c","d"]
#     return render_template("Hello.html", cha = s, lst = aList)

# 案例：从页面上接收数据
# 登录验证

@app.route("/")
def index():
    return render_template("Login.html")

@app.route("/login", methods=["POST"])
def login():
    # 接收到用户名和密码
    username = request.form.get("username")
    password = request.form.get("pwd")
    # request.args.get() url传参

    #连库：
    #select * from users where username = %s and password = %s
    #能查到->成功 查不到-失败
    if username == "alex" and password == "123":
        return "Login Success"
    else:
        return render_template("Login.html", msg = "Failed")


if __name__ == '__main__': #固定写法 程序入口
    app.run() #启动一个flask项目


