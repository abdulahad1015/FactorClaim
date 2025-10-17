# Bug Fix: Display IDs Instead of Names

## Problem
Throughout the application, IDs (like `68e8db76b6684b728e5471f7`) were being displayed instead of user-friendly names for:
- Representatives (rep_id)
- Merchants (merchant_id)
- Items (item_id)

This was particularly problematic in the Factory Dashboard where Factory users don't have permission to access the users list.

## Root Cause
The helper functions (`getUserName`, `getMerchantName`, `getItemName`) were returning the raw ID when:
1. The entity was not found in the respective array
2. The array was empty (e.g., Factory users can't access users list)
3. The ID didn't match due to field name mismatches (`id` vs `_id`)

## Solution

### Factory Dashboard (`DesktopApp/src/components/FactoryDashboard.js`)

Updated helper functions to provide user-friendly fallbacks:

```javascript
const getUserName = (userId) => {
  if (!userId) return 'Unknown';
  const foundUser = users.find(u => u.id === userId || u._id === userId);
  if (foundUser) return foundUser.name;
  // If users array is empty (no permission), show a friendly fallback
  return users.length === 0 ? 'Rep' : `Rep (${userId.slice(-6)})`;
};

const getMerchantName = (merchantId) => {
  if (!merchantId) return 'Unknown';
  const foundMerchant = merchants.find(m => m._id === merchantId || m.id === merchantId);
  return foundMerchant ? foundMerchant.name || foundMerchant.address : `Merchant ${merchantId.slice(-6)}`;
};

const getItemName = (itemId) => {
  if (!itemId) return 'Unknown';
  const foundItem = items.find(i => i._id === itemId || i.id === itemId);
  return foundItem ? `${foundItem.name} - ${foundItem.model}` : `Item ${itemId.slice(-6)}`;
};
```

### Admin Dashboard (`DesktopApp/src/components/AdminDashboard.js`)

Applied similar improvements:

```javascript
const getUserName = (userId) => {
  if (!userId) return 'Unknown';
  const foundUser = users.find(u => u.id === userId || u._id === userId);
  return foundUser ? foundUser.name : `User ${userId.slice(-6)}`;
};

const getMerchantName = (merchantId) => {
  if (!merchantId) return 'Unknown';
  const foundMerchant = merchants.find(m => m._id === merchantId || m.id === merchantId);
  return foundMerchant ? foundMerchant.name || foundMerchant.address : `Merchant ${merchantId.slice(-6)}`;
};
```

## Key Improvements

### 1. Null/Undefined Handling
```javascript
if (!userId) return 'Unknown';
```
Returns "Unknown" for null or undefined IDs instead of crashing.

### 2. Flexible ID Matching
```javascript
users.find(u => u.id === userId || u._id === userId)
```
Checks both `id` and `_id` fields since:
- MongoDB documents use `_id`
- Pydantic models alias it to `id`
- Frontend may receive either format

### 3. Context-Aware Fallbacks

**For Factory Users (no user list access):**
- Shows "Rep" instead of long ID string
- Keeps UI clean and professional

**For Admin Users (has access but entity not found):**
- Shows abbreviated ID: `Rep (5471f7)` or `User 5471f7`
- Last 6 characters provide enough info for debugging
- Still user-friendly

**For Merchants/Items:**
- Shows type + abbreviated ID: `Merchant 5471f7` or `Item 5471f7`
- Helps identify the type of entity

### 4. Special Case for Empty Arrays
```javascript
return users.length === 0 ? 'Rep' : `Rep (${userId.slice(-6)})`;
```
- If array is empty (permission issue), show generic label
- If array has data but ID not found, show abbreviated ID

## Display Examples

### Before Fix
```
Representative: 68e8db76b6684b728e5471f7
Merchant: 68e8d5e345a71bdb62beaa40
Item: 507f1f77bcf86cd799439013
```

### After Fix

**When data is available:**
```
Representative: John Doe
Merchant: ABC Electronics
Item: LED Bulb - LB-100
```

**When data is not available (Factory user):**
```
Representative: Rep
Merchant: Merchant 5471f7
Item: Item 439013
```

**When entity not found (Admin with access):**
```
Representative: User 5471f7
Merchant: Merchant beaa40
Item: Item 439013
```

## Testing

### Test Scenario 1: Factory User
1. Login as Factory user
2. View claim details
3. **Expected:** See "Rep" instead of long ID string
4. **Expected:** See merchant/item names if available, or abbreviated IDs

### Test Scenario 2: Admin User
1. Login as Admin user
2. View statistics with claims
3. **Expected:** See actual user names in "Recent Claims" table
4. **Expected:** If a user is deleted but claim remains, see abbreviated ID

### Test Scenario 3: Representative User
1. Login as Rep user
2. View claims list
3. **Expected:** See merchant names in claims
4. **Expected:** Graceful handling if merchant is deleted

## Impact

### User Experience
- ✅ Clean, professional display of information
- ✅ No overwhelming long ID strings
- ✅ Easy to understand even without full permissions
- ✅ Helpful abbreviated IDs for debugging when needed

### Developer Experience
- ✅ Consistent helper function pattern across components
- ✅ Defensive programming with null checks
- ✅ Flexible ID matching for different serialization formats
- ✅ Easy to debug with last 6 chars of IDs

### Security
- ✅ Doesn't expose full IDs unnecessarily
- ✅ Gracefully handles permission restrictions
- ✅ No errors when users don't have access to certain data

## Files Modified

1. `DesktopApp/src/components/FactoryDashboard.js`
   - Enhanced `getUserName()`, `getMerchantName()`, `getItemName()`

2. `DesktopApp/src/components/AdminDashboard.js`
   - Enhanced `getUserName()`, `getMerchantName()`

## Related Issues Fixed

This fix also addresses:
- Display issues when entities are deleted but references remain
- Inconsistent ID field names (`id` vs `_id`)
- Permission-based data visibility
- Null/undefined ID values

## Best Practices Applied

1. **Defensive Programming**: Check for null/undefined before processing
2. **Graceful Degradation**: Show useful fallback when data unavailable
3. **User-Centric Design**: Prioritize readability over raw data
4. **Flexible Matching**: Handle different serialization formats
5. **Context Awareness**: Different fallbacks based on user permissions
