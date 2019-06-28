# From here: https://stackoverflow.com/questions/39801718/how-to-run-a-http-server-which-serve-a-specific-path
import http.server
import socketserver
import os

PORT = 2929

web_dir = "/path/to/serve"
os.chdir(web_dir)

Handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.TCPServer(("", PORT), Handler)
print("serving at port", PORT)
httpd.serve_forever()
