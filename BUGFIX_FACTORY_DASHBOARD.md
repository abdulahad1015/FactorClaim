# Bug Fix: Factory Dashboard "Operation not permitted" Error

## Problem
The Factory Dashboard was showing an "Operation not permitted" error and displaying 0 claims, even though there were claims in the database.

## Root Cause
The Factory Dashboard was attempting to load data from API endpoints that required Admin permissions:
- `usersAPI.getAll()` - Requires Admin role
- The error from this call was not being caught, causing the entire `loadData()` function to fail
- This prevented claims and other data from loading

## Backend Permissions Summary
Based on the backend router configurations:

### Users API (`/api/users/`)
- `GET /api/users/` - **Admin only**
- All other user operations - **Admin only**

### Items API (`/api/items/`)
- `GET /api/items/` - **Any authenticated user**
- Create/Update/Delete - **Admin only**

### Merchants API (`/api/merchants/`)
- `GET /api/merchants/` - **Any authenticated user**
- Create/Update/Delete - **Admin or Rep**

### Claims API (`/api/claims/`)
- `GET /api/claims/` - **Any authenticated user**
- `GET /api/claims/unverified` - **Admin or Factory**
- `PUT /api/claims/{id}/verify` - **Admin or Factory**
- Create/Update/Delete - **Admin or Rep**

## Solution

### Factory Dashboard Changes (`DesktopApp/src/components/FactoryDashboard.js`)

#### 1. Improved Permission Handling in `loadData()`
Updated the function to gracefully handle permission errors:

```javascript
const loadData = async () => {
  setLoading(true);
  setError('');
  try {
    // Load claims with fallback to unverified endpoint
    let claimsData;
    try {
      claimsData = await claimsAPI.getAll();
    } catch (err) {
      console.log('Using unverified claims endpoint for factory user');
      claimsData = await claimsAPI.getUnverified();
    }
    
    // Load supporting data with proper error handling
    let usersData = [];
    let merchantsData = [];
    let itemsData = [];
    
    // Try to load users (only Admin has access)
    try {
      usersData = await usersAPI.getAll();
    } catch (err) {
      console.log('Factory user does not have permission to view users list');
    }
    
    // Try to load merchants and items (all authenticated users have access)
    try {
      const results = await Promise.all([
        merchantsAPI.getAll(),
        itemsAPI.getAll()
      ]);
      merchantsData = results[0];
      itemsData = results[1];
    } catch (err) {
      console.error('Error loading merchants/items:', err);
      setError(getErrorMessage(err, 'Failed to load some data'));
    }
    
    setClaims(claimsData);
    setUsers(usersData);
    setMerchants(merchantsData);
    setItems(itemsData);
  } catch (err) {
    setError(getErrorMessage(err, 'Failed to load data'));
  } finally {
    setLoading(false);
  }
};
```

**Key Changes:**
- Wrapped `usersAPI.getAll()` in a try-catch block to silently fail for Factory users
- Separated API calls to prevent one failure from blocking others
- Set `usersData` to empty array by default (Factory doesn't need user names)
- Logs information instead of showing error to user for expected permission denials

#### 2. Enhanced Date Formatting
```javascript
const formatDate = (dateString) => {
  if (!dateString) {
    return 'N/A';
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};
```

### Rep Dashboard Changes (`DesktopApp/src/components/RepDashboard.js`)

Also applied the same date formatting improvements to ensure consistency:
- Added `formatDate()` helper function
- Replaced inline `new Date(claim.date).toLocaleDateString()` with `formatDate(claim.date)`

## Testing

### Prerequisites
Ensure you've run the migration script to add date fields to existing claims:
```cmd
cd Backend
python migrate_claims_dates.py
```

### Test Steps

1. **Restart the Desktop App**

2. **Login as Factory User**
   - Name: Any factory user name
   - Type: Factory

3. **Verify Factory Dashboard**
   - ✅ No "Operation not permitted" error
   - ✅ Claims statistics display correctly (Total/Pending/Verified counts)
   - ✅ Pending claims list shows with proper dates (e.g., "Oct 12, 2025")
   - ✅ Can view and verify claims
   - ✅ No errors in browser console (except expected permission log messages)

4. **Login as Rep User**
   - Verify date formatting is consistent in claims list

5. **Login as Admin User**
   - Verify Admin Dashboard statistics still work correctly
   - Verify date formatting is consistent

## Impact

### Before Fix
- ❌ Factory Dashboard showed "Operation not permitted" error
- ❌ No claims displayed
- ❌ Factory users couldn't perform their job
- ❌ Dates showed as "Invalid Date"

### After Fix
- ✅ Factory Dashboard loads successfully for Factory users
- ✅ Claims display correctly with accurate statistics
- ✅ Factory users can view and verify claims
- ✅ Graceful handling of permission-denied scenarios
- ✅ Consistent date formatting across all dashboards
- ✅ No unnecessary error messages for expected permission denials

## Files Modified

1. `DesktopApp/src/components/FactoryDashboard.js`
   - Improved permission error handling in `loadData()`
   - Enhanced `formatDate()` function

2. `DesktopApp/src/components/RepDashboard.js`
   - Added `formatDate()` helper function
   - Improved date display consistency

3. `Backend/app/utils/crud_claim.py` (from previous fix)
   - Auto-populate date fields on claim creation

4. `Backend/app/utils/crud_base.py` (from previous fix)
   - Serialize datetime objects to ISO format strings

5. `Backend/migrate_claims_dates.py` (from previous fix)
   - Migration script to add dates to existing claims

## Best Practices Applied

1. **Graceful Degradation**: Dashboard works with limited permissions rather than completely failing
2. **Separation of Concerns**: Each API call is handled independently
3. **User Experience**: Only show errors for unexpected failures, not for expected permission denials
4. **Logging**: Console logs help developers understand what's happening without alarming users
5. **Consistency**: Same date formatting logic across all dashboards
6. **Error Handling**: Multiple layers of try-catch for robust error handling

## Related Documentation
- See `BUGFIX_INVALID_DATE.md` for date field issues and migration steps
