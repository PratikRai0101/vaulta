#!/usr/bin/env python3
"""Exercise the real native APK's preview UI; never clears app or wallet data."""
import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[2]
out = root / '.local-build' / 'android-verification'
out.mkdir(parents=True, exist_ok=True)
adb = str(Path(os.environ.get('ANDROID_HOME', str(Path.home() / 'Library/Android/sdk'))) / 'platform-tools/adb')
selector = ['-s', os.environ['ANDROID_SERIAL']] if os.environ.get('ANDROID_SERIAL') else ['-e']

def run(*args):
    return subprocess.check_output([adb, *selector, *args], stderr=subprocess.STDOUT)

def tree():
    run('shell', 'uiautomator', 'dump', '/sdcard/vaulta-check.xml')
    destination = out / 'window.xml'
    run('pull', '/sdcard/vaulta-check.xml', str(destination))
    return ET.parse(destination).getroot()

def wait_label(label, attempts=8):
    for _ in range(attempts):
        nodes = list(tree().iter('node'))
        for node in nodes:
            if label in (node.get('text', '') + ' ' + node.get('content-desc', '')):
                return node
        time.sleep(.2)
    raise AssertionError(f'Native screen did not expose {label!r}; app may have crashed or failed navigation')

def tap(label):
    node = wait_label(label)
    values = list(map(int, re.findall(r'\d+', node.get('bounds', ''))))
    assert len(values) == 4
    run('shell', 'input', 'tap', str((values[0] + values[2]) // 2), str((values[1] + values[3]) // 2))

def capture(name):
    (out / f'{name}.png').write_bytes(run('exec-out', 'screencap', '-p'))

run('shell', 'am', 'force-stop', 'com.vaulta.wallet')
run('shell', 'am', 'start', '-n', 'com.vaulta.wallet/.MainActivity')
tap('Try design preview')
wait_label('PREVIEW')
wait_label('Your wallet')
assert run('shell', 'pidof', 'com.vaulta.wallet').strip(), 'Vaulta process died entering tabs'
capture('wallet')
report = {'nativePreview': 'Wallet tabs mounted after explicit preview entry', 'walletOperations': 'not tested by this preview check'}
(out / 'result.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
