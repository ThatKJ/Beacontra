# Beacontra Browser QA Report

## Supported Platforms
Beacontra relies on modern web standards (ES6 modules, `fetch`, native DOM manipulation without a heavy SPA framework) and is verified to function on:

### Desktop
- **Google Chrome (v115+)**: 100% feature support. Local file uploads via `URL.createObjectURL` are instantaneous.
- **Mozilla Firefox (v115+)**: 100% feature support. Form validation (`reportValidity`) functions correctly.
- **Apple Safari (v16+)**: 100% feature support. Input components and basic styling render identically.

### Mobile
- **Safari on iOS (16+)**: Supported. Responsive layout (using max-width constraints) functions properly.
- **Chrome on Android**: Supported. File upload button successfully triggers the native OS file picker and camera integration.

## Known Minor Rendering Variances
- **Focus Rings**: Firefox and Safari exhibit slightly different default outlines for interactive elements, which are partially normalized via `globals.css` but may still show platform-specific hues.
- **Native Input Styling**: The `type="file"` input renders its "Choose File" button differently depending on the operating system. This is expected and maintains accessibility.
