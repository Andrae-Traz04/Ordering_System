import urllib.request
import json

def fetch(url, method='GET', data=None):
    try:
        if data is not None:
            data_bytes = json.dumps(data).encode('utf-8')
            req = urllib.request.Request(url, data=data_bytes, headers={'Content-Type':'application/json'}, method=method)
        else:
            req = urllib.request.Request(url, method=method)
        with urllib.request.urlopen(req, timeout=10) as r:
            payload = json.load(r)
            print(json.dumps(payload, indent=2))
    except Exception as e:
        print('ERROR:', e)

if __name__ == '__main__':
    print('== /api/v1/knowledge/ ==')
    fetch('http://localhost:8000/api/v1/knowledge/')
    print('\n== /api/v1/chat/public/ (question) ==')
    fetch('http://localhost:8000/api/v1/chat/public/', method='POST', data={'message': 'How do I reset my password?'})
