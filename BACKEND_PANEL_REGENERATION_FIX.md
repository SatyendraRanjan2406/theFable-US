# Backend Panel Regeneration Issue

## Problem
When trying to regenerate a panel for a curated story, the backend API returns an error:

```json
{
    "error": "Unexpected error: 'RegenerateComicPanelImageView' object has no attribute '_poll_facemint_task_with_retries'",
    "panel_id": "f76814c8-827f-4d5e-a7b4-262be2d2fe68",
    "panel_number": 0
}
```

## API Endpoint
The error occurs when making a POST request to:
```
POST /api/auth/panels/{panel_id}/regenerate/
```

## Root Cause
The `RegenerateComicPanelImageView` class in the Django backend is missing the `_poll_facemint_task_with_retries` method that is being called during panel regeneration.

## Frontend Workaround
I've implemented a frontend workaround that:

1. **Detects the specific error** in the `regenerateCuratedPanel` function in `src/utils/curatedStoryApi.ts`
2. **Provides a user-friendly error message** instead of the technical backend error
3. **Handles the error gracefully** in both `FinalCuratedPreview.tsx` and `Index.tsx`

## Backend Fix Required
The backend needs to be updated to include the missing method. The `RegenerateComicPanelImageView` class should have:

```python
def _poll_facemint_task_with_retries(self, task_id, max_retries=10, delay=2):
    """
    Poll the Facemint task with retries to check completion status.
    
    Args:
        task_id: The Facemint task ID to poll
        max_retries: Maximum number of retry attempts
        delay: Delay between retries in seconds
    
    Returns:
        The task result or None if failed
    """
    for attempt in range(max_retries):
        try:
            # Make API call to Facemint to check task status
            response = self.facemint_client.get_task_status(task_id)
            
            if response.get('status') == 'completed':
                return response.get('result')
            elif response.get('status') == 'failed':
                raise Exception(f"Facemint task failed: {response.get('error')}")
            
            # Task still in progress, wait before next retry
            time.sleep(delay)
            
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            time.sleep(delay)
    
    raise Exception("Task polling timed out")
```

## Testing
To test the fix:

1. **Backend**: Ensure the `_poll_facemint_task_with_retries` method is implemented
2. **Frontend**: Try regenerating a panel on a curated story edit page
3. **Expected behavior**: Panel regeneration should work without the error

## Current Status
- ✅ Frontend error handling implemented
- ❌ Backend fix required
- ⏳ Waiting for backend update

## Notes
- The frontend will show "Panel regeneration is temporarily unavailable. Please try again in a few minutes." when this error occurs
- This provides a better user experience than showing the technical backend error
- Once the backend is fixed, the regeneration should work normally 