# 📊 How to View Test Results in GitHub Actions

## 🎯 Quick Guide: See Your Test Results

---

## Step 1: Go to GitHub Actions Tab

1. Open your repository on GitHub
2. Click on **"Actions"** tab (next to "Pull requests")

```
┌─────────────────────────────────────────────────┐
│  < > Code   Issues   Pull requests   Actions    │
│                                      ^^^^^^^^    │
│                                   CLICK HERE     │
└─────────────────────────────────────────────────┘
```

---

## Step 2: See All Workflow Runs

You'll see a list like this:

```
All workflows

🟢 Playwright Tests - Enhanced Reporting
   main branch • 2 minutes ago • #42

🔴 Playwright Tests - Enhanced Reporting
   main branch • 1 hour ago • #41

🟢 Playwright Tests - Enhanced Reporting
   main branch • 3 hours ago • #40
```

- 🟢 **Green checkmark** = All tests passed
- 🔴 **Red X** = Some tests failed
- 🟡 **Yellow dot** = Tests still running

---

## Step 3: Click on a Workflow Run

Click on any workflow run to see details.

---

## Step 4: View the Summary Page

You'll see a page with:

### **A. Workflow Status**
```
✅ Playwright Tests - Enhanced Reporting
   Completed in 5m 23s
```

### **B. Jobs Status**
```
✅ Test on chromium     (3m 45s)
✅ Test on webkit       (4m 12s)
✅ Generate Report      (1m 26s)
```

### **C. Test Summary** (Scroll down)
```
🎭 Playwright Test Results - chromium

📊 Test Statistics

| Metric        | Count  |
|---------------|--------|
| ✅ Passed     | 65     |
| ❌ Failed     | 3      |
| ⚠️ Flaky      | 2      |
| ⏭️ Skipped    | 0      |
| 📈 Total      | 70     |
| 🎯 Pass Rate  | 92.86% |

❌ Failed Tests
```
- tests/migrated/pim/employee-management.spec.ts:113:9
  › PIM - Employee Management › Add Employee › should add new employee
  
- tests/migrated/leave/leave-management.spec.ts:70:9
  › Leave - Leave Management › Apply Leave › should submit leave
  
- tests/migrated/admin/admin-module.spec.ts:58:9
  › Admin - System Configuration › User Management › should create user
```

⚠️ Flaky Tests
```
- tests/migrated/dashboard/dashboard.spec.ts:35:9
  › Dashboard - Overview & Widgets › should display time widget
  
- tests/migrated/pim/employee-management.spec.ts:72:9
  › PIM - Employee Management › Employee Search › should search by name
```
```

### **D. Artifacts Section** (Bottom of page)
```
📦 Artifacts produced during runtime

playwright-report-chromium     12.5 MB    Expires in 30 days
playwright-report-webkit       11.8 MB    Expires in 30 days
test-results-chromium          2.3 MB     Expires in 30 days
test-results-webkit            2.1 MB     Expires in 30 days
screenshots-chromium           5.4 MB     Expires in 30 days
screenshots-webkit             4.9 MB     Expires in 30 days
```

---

## Step 5: Download and View HTML Report

### **A. Download Report**
1. Scroll to **"Artifacts"** section
2. Click on **`playwright-report-chromium`**
3. ZIP file downloads automatically

### **B. Extract ZIP File**
1. Find the downloaded file (e.g., `playwright-report-chromium.zip`)
2. Right-click → Extract All
3. Open the extracted folder

### **C. Open HTML Report**
1. Find `index.html` file
2. Double-click to open in browser
3. Interactive report opens!

---

## Step 6: Explore the HTML Report

### **Main Dashboard**
```
┌─────────────────────────────────────────────────┐
│  Playwright Test Report                         │
│                                                  │
│  ✅ 65 passed   ❌ 3 failed   ⚠️ 2 flaky        │
│  📊 Pass rate: 92.86%                           │
│  ⏱️ Duration: 3m 45s                            │
│                                                  │
│  [Filter: All] [Search tests...]                │
│                                                  │
│  📁 tests/migrated/auth/                        │
│    ✅ login.spec.ts (12 passed)                 │
│    ✅ logout.spec.ts (3 passed)                 │
│                                                  │
│  📁 tests/migrated/dashboard/                   │
│    ✅ dashboard.spec.ts (9 passed)              │
│    ⚠️ dashboard.spec.ts (1 flaky)               │
│                                                  │
│  📁 tests/migrated/pim/                         │
│    ✅ employee-management.spec.ts (12 passed)   │
│    ❌ employee-management.spec.ts (1 failed)    │
│    ⚠️ employee-management.spec.ts (1 flaky)     │
│                                                  │
│  📁 tests/migrated/leave/                       │
│    ✅ leave-management.spec.ts (8 passed)       │
│    ❌ leave-management.spec.ts (1 failed)       │
│                                                  │
│  📁 tests/migrated/admin/                       │
│    ✅ admin-module.spec.ts (16 passed)          │
│    ❌ admin-module.spec.ts (1 failed)           │
└─────────────────────────────────────────────────┘
```

### **Click on a Failed Test**
```
┌─────────────────────────────────────────────────┐
│  ❌ PIM › Add Employee › should add new employee│
│                                                  │
│  Duration: 45.2s                                │
│  Retries: 1                                     │
│                                                  │
│  📝 Error:                                      │
│  ┌─────────────────────────────────────────┐   │
│  │ TimeoutError: Locator.click: Timeout    │   │
│  │ 15000ms exceeded.                       │   │
│  │                                         │   │
│  │ Call log:                               │   │
│  │ - waiting for locator('button.save')   │   │
│  │ - locator resolved to <button>         │   │
│  │ - attempting click action              │   │
│  │ - waiting for element to be visible    │   │
│  │ - element is not visible               │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  📸 Screenshot:                                 │
│  [Click to view full size]                      │
│  ┌─────────────────────────────────────────┐   │
│  │                                         │   │
│  │     [Screenshot of page at failure]    │   │
│  │                                         │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  📹 Video:                                      │
│  [Click to play]                                │
│                                                  │
│  📊 Timeline:                                   │
│  ├─ 0s: Test started                           │
│  ├─ 2.3s: Login completed                      │
│  ├─ 5.1s: Navigated to PIM                     │
│  ├─ 8.7s: Clicked Add Employee                 │
│  ├─ 12.4s: Filled form fields                  │
│  └─ 45.2s: ❌ Timeout waiting for save button  │
└─────────────────────────────────────────────────┘
```

---

## 🎯 What Each Section Tells You

### **✅ Passed Tests**
- **Meaning**: Test completed successfully
- **Action**: None needed
- **Example**: "should successfully login"

### **❌ Failed Tests**
- **Meaning**: Test encountered an error
- **What you see**:
  - Error message (e.g., "TimeoutError")
  - Stack trace (where it failed)
  - Screenshot (page state at failure)
  - Video (full test execution)
- **Action**: Fix the issue and push again

### **⚠️ Flaky Tests**
- **Meaning**: Test failed first time, passed on retry
- **What you see**:
  - Both failure and success attempts
  - Error from first attempt
  - Success from retry
- **Action**: Review and add more stable waits

### **⏭️ Skipped Tests**
- **Meaning**: Test was intentionally skipped
- **Reasons**:
  - Marked with `.skip()`
  - Conditional skip (e.g., browser-specific)
- **Action**: None needed (unless unintentional)

---

## 📧 Email Notifications

### **When Tests Fail on Main Branch**

You'll receive an email:

```
Subject: [your-repo] Playwright Tests Failed on Main Branch (#42)

🚨 Test Failure Report

Workflow: Playwright Tests - Enhanced Reporting
Branch: main
Commit: abc123def456
Run ID: 1234567890

Details:
The Playwright test suite has failed on the main branch.

View Results:
https://github.com/your-repo/actions/runs/1234567890

Artifacts Available:
- HTML Test Reports
- JSON Test Results
- Screenshots of Failures

Next Steps:
1. Download and review test artifacts
2. Check test logs for error details
3. Fix failing tests
4. Push fixes to main branch
```

### **GitHub Issue Created**

An issue is automatically created:

```
Title: 🚨 Playwright Tests Failed on Main Branch

Labels: bug, test-failure, ci, high-priority

Body:
[Same content as email]
```

---

## 🔍 Common Error Messages

### **1. TimeoutError**
```
TimeoutError: Locator.click: Timeout 15000ms exceeded
```
**Meaning**: Element not found or not clickable within 15 seconds  
**Fix**: Increase timeout or fix selector

### **2. Element Not Found**
```
Error: locator.click: Target closed
```
**Meaning**: Element disappeared or page navigated  
**Fix**: Add wait before action

### **3. Assertion Failed**
```
Error: expect(locator).toBeVisible()
Expected: visible
Received: hidden
```
**Meaning**: Element is not visible as expected  
**Fix**: Check if element exists or add wait

### **4. Network Error**
```
Error: page.goto: net::ERR_CONNECTION_REFUSED
```
**Meaning**: Cannot connect to application  
**Fix**: Check if application is running

---

## ✅ Quick Checklist

After pushing to main:

- [ ] Go to GitHub Actions tab
- [ ] Click on latest workflow run
- [ ] Check overall status (green/red)
- [ ] View test summary
- [ ] Check pass/fail/flaky counts
- [ ] If failed:
  - [ ] Download HTML report
  - [ ] Open index.html
  - [ ] Click on failed tests
  - [ ] Read error messages
  - [ ] View screenshots
  - [ ] Identify root cause
  - [ ] Fix and push again

---

## 🎉 Success!

When all tests pass, you'll see:

```
✅ Playwright Tests - Enhanced Reporting
   All checks have passed

🎭 Playwright Test Results - chromium
📊 Test Statistics
| ✅ Passed     | 70     |
| ❌ Failed     | 0      |
| ⚠️ Flaky      | 0      |
| 🎯 Pass Rate  | 100%   |

🎉 All tests passed successfully!
```

---

## 📞 Need Help?

- **Can't find Actions tab?** Make sure you're logged into GitHub
- **No artifacts?** Check if workflow completed
- **Can't open HTML report?** Try different browser
- **Tests failing locally but passing in CI?** Check environment differences

---

**You're all set! Push your code and watch the results! 🚀**
