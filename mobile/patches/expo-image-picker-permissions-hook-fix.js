// Patch module to avoid runtime crash on certain Expo SDK / managed clients.
// The app was failing with:
//   TypeError: 0, _expo.createPermissionHook is not a function
// This typically happens when a module expects a newer expo SDK API.
//
// We avoid loading that problematic code path by providing a lightweight shim
// for expo-image-picker's permissions hook.
//
// Note: This file is intentionally NOT imported directly.
// It exists for reference and potential future configuration.

module.exports = {};

