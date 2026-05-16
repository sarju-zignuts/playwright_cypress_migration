# 🚀 Quick Start Guide - Playwright AI Testing

## ⚡ Get Started in 5 Minutes

### 1. Install Dependencies
```bash
cd playwright-ai-testing
npm install
```

### 2. Install Browsers
```bash
npm run install:browsers
```

### 3. Run Tests
```bash
# Run all tests
npm test

# Run in UI mode (recommended for first time)
npm run test:ui

# Run migrated tests only
npm run test:migrated
```

### 4. View Results
```bash
npm run report
```

---

## 📋 Common Commands

### Running Tests

```bash
# All tests
npm test

# Specific browser
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Specific module
npx playwright test tests/migrated/auth
npx playwright test tests/migrated/dashboard
npx playwright test tests/migrated/pim

# Debug mode
npm run test:debug

# Headed mode (see browser)
npm run test:headed

# UI mode (interactive)
npm run test:ui
```

### Reports

```bash
# View HTML report
npm run report

# Generate and view
npm test && npm run report
```

---

## 📁 Project Structure

```
playwright-ai-testing/
├── tests/migrated/          # All migrated Cypress tests
│   ├── auth/               # Login/Logout (15 tests)
│   ├── dashboard/          # Dashboard (10 tests)
│   ├── pim/                # Employee Management (12 tests)
│   ├── leave/              # Leave Management (10 tests)
│   └── admin/              # Admin Module (18 tests)
├── tests/ai-ui/            # AI UI tests (demo)
├── pages/migrated/         # Page Objects
├── utils/                  # Test helpers
├── fixtures/               # Test data
└── docs/                   # Documentation
```

---

## 🎯 What's Included

### ✅ Migrated Tests (65 total)
- **Auth**: Login & Logout
- **Dashboard**: Widgets & Navigation
- **PIM**: Employee Management
- **Leave**: Leave Management
- **Admin**: System Configuration

### ✅ AI UI Testing Framework
- Streaming text patterns
- Retry mechanisms
- Error handling
- Clipboard operations
- **20+ reusable patterns** in Recipe Book

### ✅ Documentation
- Complete README
- AI UI Testing Recipe Book
- Migration guides
- Quick start (this file)

### ✅ CI/CD
- GitHub Actions workflow
- Multi-browser testing
- Parallel execution
- Automated reports

---

## 🔧 Configuration

### Environment Variables

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```env
BASE_URL=https://opensource-demo.orangehrmlive.com
ORANGEHRM_USERNAME=Admin
ORANGEHRM_PASSWORD=admin123
```

### Playwright Config

Edit `playwright.config.ts` for:
- Base URL
- Timeouts
- Retries
- Browsers
- Reporters

---

## 📊 Test Results

### Expected Pass Rates
- **Chromium**: ~92%
- **Firefox**: ~92%
- **WebKit**: ~85%

Some failures are due to demo site instability and WebKit SSL issues.

---

## 🐛 Troubleshooting

### Tests Failing?

1. **Check network connection**
   ```bash
   ping opensource-demo.orangehrmlive.com
   ```

2. **Update browsers**
   ```bash
   npm run install:browsers
   ```

3. **Run in debug mode**
   ```bash
   npm run test:debug
   ```

4. **Check specific test**
   ```bash
   npx playwright test tests/migrated/auth/login.spec.ts --debug
   ```

### Common Issues

**Issue**: Browsers not installed
```bash
npm run install:browsers
```

**Issue**: Tests timing out
- Increase timeout in `playwright.config.ts`
- Check network speed
- Try running fewer tests in parallel

**Issue**: WebKit failures
- Known issue with demo site SSL
- Tests pass in Chromium and Firefox
- Can skip WebKit: `npm run test:chromium`

---

## 📚 Learn More

### Documentation
- [README.md](./README.md) - Full documentation
- [AI UI Testing Recipes](./docs/ai-ui-testing-recipes.md) - Testing patterns
- [Migration Complete](./MIGRATION_COMPLETE.md) - Migration details
- [Project Summary](./PROJECT_SUMMARY.md) - Implementation status

### External Resources
- [Playwright Docs](https://playwright.dev)
- [Playwright API](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)

---

## 🎓 Next Steps

### 1. Explore Tests
```bash
# Run in UI mode to see tests visually
npm run test:ui
```

### 2. Read Documentation
- Check out the [AI UI Testing Recipe Book](./docs/ai-ui-testing-recipes.md)
- Review [README.md](./README.md) for detailed info

### 3. Run CI/CD
- Push to GitHub
- GitHub Actions will run automatically
- View results in Actions tab

### 4. Implement AI Tests
- Review demo tests in `tests/ai-ui/`
- Follow patterns from Recipe Book
- Create your AI Writing Assistant tests

---

## 💡 Tips

### Writing Tests

1. **Use Page Objects**
   ```typescript
   const loginPage = new LoginPage(page);
   await loginPage.goto();
   await loginPage.login('Admin', 'admin123');
   ```

2. **Use Test Helpers**
   ```typescript
   await TestHelpers.login(page);
   await TestHelpers.navigateToMenu(page, 'PIM');
   ```

3. **Use Proper Waits**
   ```typescript
   // Good
   await expect(page.locator('.element')).toBeVisible();
   
   // Avoid
   await page.waitForTimeout(5000);
   ```

### Debugging

1. **Use UI Mode**
   ```bash
   npm run test:ui
   ```

2. **Use Debug Mode**
   ```bash
   npm run test:debug
   ```

3. **Add Screenshots**
   ```typescript
   await page.screenshot({ path: 'debug.png' });
   ```

4. **Use Console Logs**
   ```typescript
   console.log(await page.locator('.element').textContent());
   ```

---

## 🎉 You're Ready!

You now have:
- ✅ Complete test suite (65 tests)
- ✅ Multi-browser support
- ✅ CI/CD pipeline
- ✅ Comprehensive documentation
- ✅ AI UI testing framework

**Start testing:**
```bash
npm run test:ui
```

**Happy Testing! 🎭**

---

*For detailed information, see [README.md](./README.md)*
