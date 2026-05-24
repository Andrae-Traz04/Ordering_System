import urllib.request
import json

url='http://localhost:8000/api/v1/chat/public/'
data=json.dumps({'message':'How do I log in to my account?'}).encode('utf-8')
req=urllib.request.Request(url, data=data, headers={'Content-Type':'application/json'})
try:
    with urllib.request.urlopen(req, timeout=15) as r:
        resp = json.load(r)
        print(json.dumps(resp, indent=2))
except Exception as e:
    print('ERROR:', e)
