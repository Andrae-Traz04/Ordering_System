import urllib.request, json
url='http://localhost:11434/api/generate'
payload={'model':'qwen2.5:0.5b','prompt':'Hello','options':{'temperature':0.1}}
req=urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type':'application/json'})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        print(r.read().decode())
except Exception as e:
    print('ERROR', e)
