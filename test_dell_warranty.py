# test_dell_warranty.py
# Automated Verification Test Suite for Dell Asset Warranty & Hardware Refresh Lifecycle Engine

import os
import sys
import subprocess
import json
import xml.etree.ElementTree as ET

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def test_xaml_validity():
    print("\n--- Test 1: XAML Syntax & XML Tree Integrity ---")
    ps1_path = os.path.join(os.path.dirname(__file__), 'autopilot.ps1')
    assert os.path.exists(ps1_path), "autopilot.ps1 missing"

    with open(ps1_path, 'r', encoding='utf-8') as f:
        content = f.read()

    start = content.find('$xaml = @\'\n') + len('$xaml = @\'\n')
    end = content.find('\n\'@', start)
    assert start > len('$xaml = @\'\n') and end > start, "Could not extract XAML block"

    xaml = content[start:end]
    tree = ET.fromstring(xaml)
    assert 'Window' in tree.tag, f"Root element expected Window, got {tree.tag}"
    elements = list(tree.iter())
    print(f"  [PASS] XAML XML successfully parsed: {len(elements)} nodes.")

    # Verify Tab 5 exists in XAML
    tab_headers = [elem.attrib.get('Header', '') for elem in tree.iter() if elem.tag.endswith('TabItem')]
    assert any('Dell' in h for h in tab_headers), f"Dell tab not found in TabHeaders: {tab_headers}"
    print(f"  [PASS] Dell Warranty Tab found in XAML: {tab_headers}")

def test_standalone_get_dell_warranty():
    print("\n--- Test 2: Get-DellWarranty.ps1 Invocation (BIOS Service Tag) ---")
    script_path = os.path.join(os.path.dirname(__file__), 'Get-DellWarranty.ps1')
    assert os.path.exists(script_path), "Get-DellWarranty.ps1 missing"

    cmd = [
        'pwsh', '-ExecutionPolicy', 'Bypass', '-Command',
        f'& "{script_path}" -ServiceTag "6BYQJW2" -OutputFormat Json'
    ]
    res = subprocess.run(cmd, capture_output=True, encoding='utf-8', errors='replace')
    assert res.returncode == 0, f"Get-DellWarranty.ps1 failed with code {res.returncode}: {res.stderr}"

    data = json.loads(res.stdout.strip())
    assert data['ServiceTag'] == '6BYQJW2', f"Unexpected service tag: {data.get('ServiceTag')}"
    assert 'Dell' in data['SystemModel'], f"Unexpected system model: {data.get('SystemModel')}"
    assert data['WarrantyEndDate'] == '2024-01-14', f"Unexpected warranty end date: {data.get('WarrantyEndDate')}"
    assert data['IsUnderWarranty'] is False, f"Expected out of warranty, got {data.get('IsUnderWarranty')}"
    assert 'REFRESH RECOMMENDED' in data['RefreshVerdict'], f"Unexpected verdict: {data.get('RefreshVerdict')}"
    assert len(data['Entitlements']) >= 3, f"Expected at least 3 entitlements, got {len(data.get('Entitlements', []))}"
    print(f"  [PASS] Get-DellWarranty verified: {data['SystemModel']} | Status: {data['WarrantyStatus']} | Verdict: {data['RefreshVerdict']}")

def test_autopilot_cli_dell_warranty():
    print("\n--- Test 3: autopilot.ps1 -DellWarranty CLI Mode ---")
    script_path = os.path.join(os.path.dirname(__file__), 'autopilot.ps1')
    csv_path = os.path.join(os.environ.get('TEMP', 'C:\\temp'), 'TestDellWarranty.csv')

    if os.path.exists(csv_path):
        os.remove(csv_path)

    cmd = [
        'pwsh', '-ExecutionPolicy', 'Bypass', '-Command',
        f'& "{script_path}" -DellWarranty -DellServiceTag "6BYQJW2" -ExportCsv -CsvPath "{csv_path}"'
    ]
    res = subprocess.run(cmd, capture_output=True, encoding='utf-8', errors='replace')
    assert res.returncode == 0, f"autopilot.ps1 failed: {res.stderr}"
    assert "DELL ASSET WARRANTY & REFRESH ASSESSMENT" in res.stdout, "Assessment header not in stdout"
    assert "REFRESH RECOMMENDED" in res.stdout, "Verdict not in stdout"
    assert os.path.exists(csv_path), f"CSV export file not created: {csv_path}"

    with open(csv_path, 'r', encoding='utf-8') as f:
        csv_lines = f.readlines()
    assert len(csv_lines) >= 2, f"CSV had fewer lines than expected: {csv_lines}"
    assert '6BYQJW2' in csv_lines[1], "Service tag not in CSV row"
    print(f"  [PASS] autopilot.ps1 -DellWarranty -ExportCsv verified: {csv_path} ({os.path.getsize(csv_path)} bytes)")

if __name__ == '__main__':
    print("==================================================================")
    print(" DELL WARRANTY & REFRESH ENGINE AUTOMATED VERIFICATION SUITE")
    print("==================================================================")
    test_xaml_validity()
    test_standalone_get_dell_warranty()
    test_autopilot_cli_dell_warranty()
    print("\n==================================================================")
    print(" ALL 3 TEST SUITES PASSED CLEANLY (100% EMPIRICAL VERIFICATION)")
    print("==================================================================")
