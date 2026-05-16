# AI UI Testing Recipe Book
## Reusable Testing Patterns for LLM-Based Interfaces

This document provides comprehensive testing patterns and recipes for testing AI-powered user interfaces, specifically focusing on streaming LLM (Large Language Model) interfaces.

---

## Table of Contents

1. [Streaming Text Testing Patterns](#1-streaming-text-testing-patterns)
2. [Loading States & Skeletons](#2-loading-states--skeletons)
3. [Retry Mechanisms](#3-retry-mechanisms)
4. [Error Handling Patterns](#4-error-handling-patterns)
5. [Clipboard Operations](#5-clipboard-operations)
6. [API Mocking for LLM Interfaces](#6-api-mocking-for-llm-interfaces)
7. [Performance Testing](#7-performance-testing)
8. [Accessibility Testing](#8-accessibility-testing)

---

## 1. Streaming Text Testing Patterns

### 1.1 Basic Streaming Validation

**Use Case:** Verify that text streams progressively and completes successfully.

**Code Example:**
```typescript
test('should stream text progressively', async ({ page }) => {
  await page.goto('/ai-assistant');
  await page.fill('[data-testid="prompt-input"]', 'Write a story');
  await page.click('[data-testid="submit-button"]');
  
  const responseContainer = page.locator('[data-testid="response-text"]');
  
  // Wait for streaming to start
  await responseContainer.waitFor({ state: 'visible' });
  
  // Capture initial text
  const initialText = await responseContainer.textContent();
  
  // Wait a bit for more streaming
  await page.waitForTimeout(1000);
  
  // Capture updated text
  const updatedText = await responseContainer.textContent();
  
  // Text should have grown
  expect(updatedText.length).toBeGreaterThan(initialText.length);
  
  // Wait for streaming to complete
  await page.waitForSelector('[data-testid="streaming-complete"]');
  
  const finalText = await responseContainer.textContent();
  expect(finalText.length).toBeGreaterThan(0);
});
```

**Expected Behavior:**
- Text appears incrementally
- Each update adds more content
- Streaming indicator shows during process
- Final text is complete and readable

**Common Pitfalls:**
- Don't use fixed timeouts for streaming completion
- Watch for race conditions when capturing text
- Ensure proper wait strategies for dynamic content

**Browser Compatibility:**
- ✅ Chromium
- ✅ Firefox
- ✅ WebKit

---

### 1.2 Chunk-by-Chunk Verification

**Use Case:** Monitor and validate each chunk of streamed content.

**Code Example:**
```typescript
test('should receive text in chunks', async ({ page }) => {
  const chunks: string[] = [];
  
  // Intercept streaming responses
  await page.route('**/api/stream', async (route) => {
    const response = await route.fetch();
    const reader = response.body()?.getReader();
    
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        chunks.push(chunk);
      }
    }
    
    await route.fulfill({ response });
  });
  
  await page.fill('[data-testid="prompt-input"]', 'Test prompt');
  await page.click('[data-testid="submit-button"]');
  
  // Wait for completion
  await page.waitForSelector('[data-testid="streaming-complete"]');
  
  // Verify chunks were received
  expect(chunks.length).toBeGreaterThan(0);
  
  // Verify chunks are sequential and non-empty
  chunks.forEach(chunk => {
    expect(chunk.length).toBeGreaterThan(0);
  });
});
```

**Expected Behavior:**
- Multiple chunks received
- Each chunk contains valid data
- Chunks arrive in order
- No data loss between chunks

---

### 1.3 Streaming Performance Testing

**Use Case:** Measure streaming latency and throughput.

**Code Example:**
```typescript
test('should stream with acceptable latency', async ({ page }) => {
  await page.goto('/ai-assistant');
  
  const startTime = Date.now();
  
  await page.fill('[data-testid="prompt-input"]', 'Quick response');
  await page.click('[data-testid="submit-button"]');
  
  // Time to first chunk
  await page.waitForSelector('[data-testid="response-text"]');
  const firstChunkTime = Date.now() - startTime;
  
  // Should receive first chunk within 2 seconds
  expect(firstChunkTime).toBeLessThan(2000);
  
  // Wait for completion
  await page.waitForSelector('[data-testid="streaming-complete"]');
  const totalTime = Date.now() - startTime;
  
  console.log(`First chunk: ${firstChunkTime}ms, Total: ${totalTime}ms`);
});
```

---

## 2. Loading States & Skeletons

### 2.1 Skeleton Component Testing

**Use Case:** Verify loading skeleton appears before streaming starts.

**Code Example:**
```typescript
test('should display loading skeleton before streaming', async ({ page }) => {
  await page.goto('/ai-assistant');
  await page.fill('[data-testid="prompt-input"]', 'Write a story');
  await page.click('[data-testid="submit-button"]');
  
  // Skeleton should appear immediately
  const skeleton = page.locator('[data-testid="loading-skeleton"]');
  await expect(skeleton).toBeVisible({ timeout: 1000 });
  
  // Verify skeleton structure
  const skeletonLines = skeleton.locator('.skeleton-line');
  await expect(skeletonLines).toHaveCount(3, { timeout: 1000 });
  
  // Wait for streaming to start
  await page.waitForSelector('[data-testid="streaming-text"]');
  
  // Skeleton should disappear
  await expect(skeleton).not.toBeVisible();
});
```

**Expected Behavior:**
- Skeleton appears within 100ms of submission
- Skeleton has proper structure (lines, shapes)
- Skeleton disappears when real content arrives
- No flash of unstyled content

---

### 2.2 Progressive Loading Indicators

**Use Case:** Test animated loading indicators during streaming.

**Code Example:**
```typescript
test('should show streaming indicator during response', async ({ page }) => {
  await page.goto('/ai-assistant');
  await page.fill('[data-testid="prompt-input"]', 'Test');
  await page.click('[data-testid="submit-button"]');
  
  // Streaming indicator should be visible
  const indicator = page.locator('[data-testid="streaming-indicator"]');
  await expect(indicator).toBeVisible();
  
  // Verify animation is running
  const isAnimated = await indicator.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return style.animationName !== 'none';
  });
  expect(isAnimated).toBe(true);
  
  // Wait for completion
  await page.waitForSelector('[data-testid="streaming-complete"]');
  
  // Indicator should disappear
  await expect(indicator).not.toBeVisible();
});
```

---

### 2.3 Transition Animations

**Use Case:** Verify smooth transitions between loading and content states.

**Code Example:**
```typescript
test('should have smooth transition from skeleton to content', async ({ page }) => {
  await page.goto('/ai-assistant');
  await page.fill('[data-testid="prompt-input"]', 'Test');
  await page.click('[data-testid="submit-button"]');
  
  const skeleton = page.locator('[data-testid="loading-skeleton"]');
  const content = page.locator('[data-testid="response-text"]');
  
  // Wait for skeleton
  await expect(skeleton).toBeVisible();
  
  // Wait for content to appear
  await expect(content).toBeVisible();
  
  // Skeleton should fade out (check opacity)
  const skeletonOpacity = await skeleton.evaluate((el) => {
    return window.getComputedStyle(el).opacity;
  });
  
  // Should be fading or hidden
  expect(parseFloat(skeletonOpacity)).toBeLessThanOrEqual(1);
});
```

---

## 3. Retry Mechanisms

### 3.1 Simple Retry Testing

**Use Case:** Test basic retry functionality.

**Code Example:**
```typescript
test('should allow retry after response completion', async ({ page }) => {
  await page.goto('/ai-assistant');
  await page.fill('[data-testid="prompt-input"]', 'First prompt');
  await page.click('[data-testid="submit-button"]');
  
  // Wait for completion
  await page.waitForSelector('[data-testid="streaming-complete"]');
  
  // Retry button should be visible
  const retryButton = page.locator('[data-testid="retry-button"]');
  await expect(retryButton).toBeVisible();
  await expect(retryButton).toBeEnabled();
  
  // Click retry
  await retryButton.click();
  
  // Should start streaming again
  await expect(page.locator('[data-testid="streaming-indicator"]')).toBeVisible();
});
```

---

### 3.2 State Restoration Patterns

**Use Case:** Verify previous output is preserved when retrying.

**Code Example:**
```typescript
test('should restore previous output when retry is clicked', async ({ page }) => {
  await page.goto('/ai-assistant');
  await page.fill('[data-testid="prompt-input"]', 'Test prompt');
  await page.click('[data-testid="submit-button"]');
  
  // Wait for completion
  await page.waitForSelector('[data-testid="streaming-complete"]');
  
  // Capture initial response
  const initialResponse = await page.locator('[data-testid="response-text"]').textContent();
  expect(initialResponse).toBeTruthy();
  
  // Click retry
  await page.click('[data-testid="retry-button"]');
  
  // Wait for new completion
  await page.waitForSelector('[data-testid="streaming-complete"]');
  
  // Check if history is accessible
  const historyButton = page.locator('[data-testid="view-history"]');
  if (await historyButton.isVisible()) {
    await historyButton.click();
    
    // Previous response should be in history
    const history = page.locator('[data-testid="response-history"]');
    await expect(history).toContainText(initialResponse.substring(0, 50));
  }
});
```

---

### 3.3 Retry with Context Preservation

**Use Case:** Ensure context is maintained across retries.

**Code Example:**
```typescript
test('should preserve prompt context on retry', async ({ page }) => {
  await page.goto('/ai-assistant');
  
  const originalPrompt = 'Explain quantum physics';
  await page.fill('[data-testid="prompt-input"]', originalPrompt);
  await page.click('[data-testid="submit-button"]');
  
  await page.waitForSelector('[data-testid="streaming-complete"]');
  
  // Click retry
  await page.click('[data-testid="retry-button"]');
  
  // Prompt should still be there
  const promptValue = await page.locator('[data-testid="prompt-input"]').inputValue();
  expect(promptValue).toBe(originalPrompt);
});
```

---

## 4. Error Handling Patterns

### 4.1 Network Error Simulation

**Use Case:** Test behavior when API fails.

**Code Example:**
```typescript
test('should display error message on API failure', async ({ page }) => {
  // Mock API failure
  await page.route('**/api/generate', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' })
    });
  });
  
  await page.goto('/ai-assistant');
  await page.fill('[data-testid="prompt-input"]', 'Test prompt');
  await page.click('[data-testid="submit-button"]');
  
  // Error message should appear
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('Something went wrong');
  
  // Retry button should be available
  const retryButton = page.locator('[data-testid="retry-button"]');
  await expect(retryButton).toBeVisible();
});
```

---

### 4.2 Timeout Handling

**Use Case:** Test timeout scenarios.

**Code Example:**
```typescript
test('should handle timeout gracefully', async ({ page }) => {
  // Mock slow API
  await page.route('**/api/generate', async route => {
    // Delay response beyond timeout
    await new Promise(resolve => setTimeout(resolve, 35000));
    route.fulfill({
      status: 200,
      body: JSON.stringify({ text: 'Response' })
    });
  });
  
  await page.goto('/ai-assistant');
  await page.fill('[data-testid="prompt-input"]', 'Test');
  await page.click('[data-testid="submit-button"]');
  
  // Should show timeout error
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible({ timeout: 35000 });
  await expect(errorMessage).toContainText('timeout', { ignoreCase: true });
});
```

---

### 4.3 Graceful Degradation

**Use Case:** Verify UI remains functional during errors.

**Code Example:**
```typescript
test('should allow new prompt after error', async ({ page }) => {
  // Mock API failure
  await page.route('**/api/generate', route => {
    route.fulfill({ status: 500 });
  });
  
  await page.goto('/ai-assistant');
  await page.fill('[data-testid="prompt-input"]', 'First prompt');
  await page.click('[data-testid="submit-button"]');
  
  // Wait for error
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  
  // Remove route mock
  await page.unroute('**/api/generate');
  
  // Should be able to submit new prompt
  await page.fill('[data-testid="prompt-input"]', 'Second prompt');
  const submitButton = page.locator('[data-testid="submit-button"]');
  await expect(submitButton).toBeEnabled();
});
```

---

## 5. Clipboard Operations

### 5.1 Basic Copy Testing

**Use Case:** Test copy to clipboard functionality.

**Code Example:**
```typescript
test('should copy response to clipboard', async ({ page, context }) => {
  // Grant clipboard permissions
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  
  await page.goto('/ai-assistant');
  await page.fill('[data-testid="prompt-input"]', 'Test');
  await page.click('[data-testid="submit-button"]');
  
  // Wait for response
  await page.waitForSelector('[data-testid="streaming-complete"]');
  
  const responseText = await page.locator('[data-testid="response-text"]').textContent();
  
  // Click copy button
  await page.click('[data-testid="copy-button"]');
  
  // Verify clipboard content
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toBe(responseText);
  
  // Verify success feedback
  await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();
});
```

---

### 5.2 Permission Handling

**Use Case:** Handle clipboard permission scenarios.

**Code Example:**
```typescript
test('should handle clipboard permission denial', async ({ page, context }) => {
  // Don't grant clipboard permissions
  
  await page.goto('/ai-assistant');
  await page.fill('[data-testid="prompt-input"]', 'Test');
  await page.click('[data-testid="submit-button"]');
  
  await page.waitForSelector('[data-testid="streaming-complete"]');
  
  // Try to copy
  await page.click('[data-testid="copy-button"]');
  
  // Should show fallback or error message
  const fallbackMessage = page.locator('[data-testid="copy-fallback"]');
  await expect(fallbackMessage).toBeVisible();
});
```

---

### 5.3 Cross-Browser Clipboard Testing

**Use Case:** Ensure clipboard works across browsers.

**Code Example:**
```typescript
test.describe('Clipboard across browsers', () => {
  test('should work in Chromium', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chromium-specific test');
    
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/ai-assistant');
    
    // Test clipboard functionality
    // ... (same as basic copy test)
  });
  
  test('should work in Firefox', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test');
    
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/ai-assistant');
    
    // Test clipboard functionality
    // ... (same as basic copy test)
  });
});
```

---

## 6. API Mocking for LLM Interfaces

### 6.1 Streaming Response Mocking

**Use Case:** Mock streaming API responses for consistent testing.

**Code Example:**
```typescript
test('should handle mocked streaming response', async ({ page }) => {
  // Mock streaming API
  await page.route('**/api/stream', async route => {
    const chunks = [
      'Hello ',
      'this ',
      'is ',
      'a ',
      'streamed ',
      'response.'
    ];
    
    // Simulate streaming with delays
    for (const chunk of chunks) {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: `data: ${JSON.stringify({ text: chunk })}\n\n`
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });
  
  await page.goto('/ai-assistant');
  await page.fill('[data-testid="prompt-input"]', 'Test');
  await page.click('[data-testid="submit-button"]');
  
  // Verify streaming
  await page.waitForSelector('[data-testid="streaming-indicator"]');
  await page.waitForSelector('[data-testid="streaming-complete"]');
  
  const finalText = await page.locator('[data-testid="response-text"]').textContent();
  expect(finalText).toContain('Hello this is a streamed response');
});
```

---

### 6.2 Partial Response Simulation

**Use Case:** Test handling of incomplete responses.

**Code Example:**
```typescript
test('should handle partial response interruption', async ({ page }) => {
  let chunkCount = 0;
  
  await page.route('**/api/stream', async route => {
    chunkCount++;
    
    if (chunkCount <= 3) {
      await route.fulfill({
        status: 200,
        body: `data: ${JSON.stringify({ text: `Chunk ${chunkCount} ` })}\n\n`
      });
    } else {
      // Simulate connection interruption
      await route.abort('failed');
    }
  });
  
  await page.goto('/ai-assistant');
  await page.fill('[data-testid="prompt-input"]', 'Test');
  await page.click('[data-testid="submit-button"]');
  
  // Should show error after interruption
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();
  
  // Partial content should be preserved
  const responseText = await page.locator('[data-testid="response-text"]').textContent();
  expect(responseText).toContain('Chunk');
});
```

---

### 6.3 Error Response Patterns

**Use Case:** Mock various error scenarios.

**Code Example:**
```typescript
const errorScenarios = [
  { status: 400, error: 'Bad Request', message: 'Invalid prompt' },
  { status: 429, error: 'Too Many Requests', message: 'Rate limit exceeded' },
  { status: 500, error: 'Internal Server Error', message: 'Server error' },
  { status: 503, error: 'Service Unavailable', message: 'Service temporarily unavailable' }
];

errorScenarios.forEach(scenario => {
  test(`should handle ${scenario.status} error`, async ({ page }) => {
    await page.route('**/api/generate', route => {
      route.fulfill({
        status: scenario.status,
        contentType: 'application/json',
        body: JSON.stringify({ error: scenario.error, message: scenario.message })
      });
    });
    
    await page.goto('/ai-assistant');
    await page.fill('[data-testid="prompt-input"]', 'Test');
    await page.click('[data-testid="submit-button"]');
    
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(scenario.message);
  });
});
```

---

## 7. Performance Testing

### 7.1 Streaming Latency Measurement

**Use Case:** Measure and validate streaming performance.

**Code Example:**
```typescript
test('should measure streaming latency', async ({ page }) => {
  const metrics = {
    timeToFirstByte: 0,
    timeToFirstChunk: 0,
    totalStreamingTime: 0,
    chunkCount: 0
  };
  
  const startTime = Date.now();
  
  await page.goto('/ai-assistant');
  await page.fill('[data-testid="prompt-input"]', 'Test prompt');
  await page.click('[data-testid="submit-button"]');
  
  // Time to first chunk
  await page.waitForSelector('[data-testid="response-text"]');
  metrics.timeToFirstChunk = Date.now() - startTime;
  
  // Monitor chunks
  await page.waitForSelector('[data-testid="streaming-complete"]');
  metrics.totalStreamingTime = Date.now() - startTime;
  
  // Log metrics
  console.log('Performance Metrics:', metrics);
  
  // Assertions
  expect(metrics.timeToFirstChunk).toBeLessThan(3000); // First chunk within 3s
  expect(metrics.totalStreamingTime).toBeLessThan(30000); // Complete within 30s
});
```

---

### 7.2 UI Responsiveness During Streaming

**Use Case:** Ensure UI remains responsive during streaming.

**Code Example:**
```typescript
test('should maintain UI responsiveness during streaming', async ({ page }) => {
  await page.goto('/ai-assistant');
  await page.fill('[data-testid="prompt-input"]', 'Long response prompt');
  await page.click('[data-testid="submit-button"]');
  
  // Wait for streaming to start
  await page.waitForSelector('[data-testid="streaming-indicator"]');
  
  // Try to interact with UI during streaming
  const stopButton = page.locator('[data-testid="stop-button"]');
  
  // Button should be clickable
  await expect(stopButton).toBeEnabled();
  
  // Click should be responsive (< 100ms)
  const clickStart = Date.now();
  await stopButton.click();
  const clickDuration = Date.now() - clickStart;
  
  expect(clickDuration).toBeLessThan(100);
  
  // Streaming should stop
  await expect(page.locator('[data-testid="streaming-indicator"]')).not.toBeVisible();
});
```

---

### 7.3 Memory Leak Detection

**Use Case:** Detect memory leaks during long streaming sessions.

**Code Example:**
```typescript
test('should not leak memory during multiple streams', async ({ page }) => {
  await page.goto('/ai-assistant');
  
  // Get initial memory
  const initialMemory = await page.evaluate(() => {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  });
  
  // Perform multiple streaming operations
  for (let i = 0; i < 5; i++) {
    await page.fill('[data-testid="prompt-input"]', `Test prompt ${i}`);
    await page.click('[data-testid="submit-button"]');
    await page.waitForSelector('[data-testid="streaming-complete"]');
    
    // Clear response
    await page.click('[data-testid="clear-button"]');
  }
  
  // Force garbage collection (if available)
  await page.evaluate(() => {
    if (window.gc) {
      window.gc();
    }
  });
  
  // Get final memory
  const finalMemory = await page.evaluate(() => {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  });
  
  // Memory growth should be reasonable (< 50MB)
  const memoryGrowth = finalMemory - initialMemory;
  expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
});
```

---

## 8. Accessibility Testing

### 8.1 Screen Reader Announcements

**Use Case:** Verify screen reader compatibility.

**Code Example:**
```typescript
test('should announce streaming status to screen readers', async ({ page }) => {
  await page.goto('/ai-assistant');
  await page.fill('[data-testid="prompt-input"]', 'Test');
  await page.click('[data-testid="submit-button"]');
  
  // Check for ARIA live region
  const liveRegion = page.locator('[aria-live="polite"]');
  await expect(liveRegion).toBeVisible();
  
  // Should announce streaming started
  await expect(liveRegion).toContainText('Generating response');
  
  // Wait for completion
  await page.waitForSelector('[data-testid="streaming-complete"]');
  
  // Should announce completion
  await expect(liveRegion).toContainText('Response complete');
});
```

---

### 8.2 Keyboard Navigation

**Use Case:** Test keyboard-only navigation.

**Code Example:**
```typescript
test('should support keyboard navigation', async ({ page }) => {
  await page.goto('/ai-assistant');
  
  // Tab to prompt input
  await page.keyboard.press('Tab');
  
  // Type prompt
  await page.keyboard.type('Test prompt');
  
  // Tab to submit button
  await page.keyboard.press('Tab');
  
  // Press Enter to submit
  await page.keyboard.press('Enter');
  
  // Wait for response
  await page.waitForSelector('[data-testid="streaming-complete"]');
  
  // Tab to copy button
  await page.keyboard.press('Tab');
  
  // Should focus copy button
  const copyButton = page.locator('[data-testid="copy-button"]');
  await expect(copyButton).toBeFocused();
  
  // Press Enter to copy
  await page.keyboard.press('Enter');
  
  // Should show success
  await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();
});
```

---

### 8.3 ARIA Live Regions for Streaming

**Use Case:** Proper ARIA attributes for dynamic content.

**Code Example:**
```typescript
test('should have proper ARIA attributes for streaming content', async ({ page }) => {
  await page.goto('/ai-assistant');
  
  // Check response container has proper ARIA
  const responseContainer = page.locator('[data-testid="response-container"]');
  await expect(responseContainer).toHaveAttribute('role', 'region');
  await expect(responseContainer).toHaveAttribute('aria-label', /response/i);
  
  // Submit prompt
  await page.fill('[data-testid="prompt-input"]', 'Test');
  await page.click('[data-testid="submit-button"]');
  
  // Streaming indicator should have proper ARIA
  const streamingIndicator = page.locator('[data-testid="streaming-indicator"]');
  await expect(streamingIndicator).toHaveAttribute('role', 'status');
  await expect(streamingIndicator).toHaveAttribute('aria-live', 'polite');
  
  // Response text should be in live region
  const responseText = page.locator('[data-testid="response-text"]');
  await expect(responseText).toHaveAttribute('aria-live', 'polite');
});
```

---

## Best Practices Summary

### General Guidelines

1. **Use Proper Wait Strategies**
   - Avoid fixed timeouts
   - Use `waitForSelector`, `waitForLoadState`
   - Leverage Playwright's auto-waiting

2. **Mock External Dependencies**
   - Mock API responses for consistency
   - Simulate various network conditions
   - Test edge cases with mocked data

3. **Test Across Browsers**
   - Run tests on Chromium, Firefox, WebKit
   - Be aware of browser-specific behaviors
   - Use conditional tests when needed

4. **Measure Performance**
   - Track streaming latency
   - Monitor UI responsiveness
   - Watch for memory leaks

5. **Ensure Accessibility**
   - Test with keyboard only
   - Verify screen reader compatibility
   - Check ARIA attributes

6. **Handle Errors Gracefully**
   - Test all error scenarios
   - Verify error messages
   - Ensure recovery mechanisms work

7. **Document Test Patterns**
   - Comment complex test logic
   - Provide usage examples
   - Share learnings with team

---

## Contributing

This recipe book is a living document. Please contribute new patterns and improvements as you discover them!

---

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Streaming API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
- [Testing Best Practices](https://martinfowler.com/articles/practical-test-pyramid.html)
