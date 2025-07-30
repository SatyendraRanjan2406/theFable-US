# Form Data Storage Configuration

This document explains the form data storage implementation using sessionStorage instead of localStorage.

## Storage Change: localStorage → sessionStorage

### **What Changed:**
- **Before**: Form data was saved to `localStorage` (persists across browser sessions)
- **After**: Form data is now saved to `sessionStorage` (cleared when browser tab/window closes)

### **Why This Change:**
1. **Better Privacy**: Form data is automatically cleared when the user closes the browser tab
2. **Reduced Storage Usage**: Prevents accumulation of old form data across sessions
3. **Fresh Start**: Each new session starts with a clean form
4. **Security**: Sensitive form data doesn't persist indefinitely

## Form Data Fields Stored

The following form data is saved to sessionStorage:

```typescript
interface FormData {
  // Character Details
  characterName: string;
  characterAge: string;
  characterGender: string;
  
  // Photo/Image Data
  photo: File | null; // Base64 encoded
  photoName?: string;
  photoLastModified?: number;
  cartoonImageUrl: string | null;
  selectedPhotoForStory: string | null;
  isCartoonSelectedForStory: boolean;
  uploadedPhotoUrl: string | null;
  photoUploadedAt: string | null;
  
  // Story Configuration
  genre: string;
  storyStyle: string;
  bookType: string;
  message: string;
  storyLength: number[];
  storyOutline: string;
}
```

## Storage Key

**Key**: `formData`

**Location**: `sessionStorage.getItem('formData')`

## Implementation Details

### **Loading Data:**
```typescript
const [formData, setFormData] = useState(() => {
  const savedData = sessionStorage.getItem('formData');
  if (savedData) {
    return JSON.parse(savedData);
  }
  return initialData;
});
```

### **Saving Data:**
```typescript
useEffect(() => {
  const saveData = async () => {
    if (formData.photo) {
      const photoBase64 = await fileToBase64String(formData.photo);
      const dataToSave = {
        ...formData,
        photo: photoBase64,
        photoName: formData.photo.name,
        photoLastModified: formData.photo.lastModified
      };
      sessionStorage.setItem('formData', JSON.stringify(dataToSave));
    } else {
      const { photo, ...rest } = formData;
      sessionStorage.setItem('formData', JSON.stringify(rest));
    }
  };
  saveData();
}, [formData]);
```

### **Clearing Data:**
```typescript
const resetFormData = () => {
  setFormData(initialData);
  sessionStorage.removeItem('formData');
};
```

## Files Updated

The following files were updated to use sessionStorage:

1. **`src/hooks/useFormData.ts`** - Main form data hook
2. **`src/components/PhotoUploadField.tsx`** - Photo upload component
3. **`src/components/CharacterDetailsForm.tsx`** - Character details form
4. **`src/pages/Index.tsx`** - Main page component

## Benefits

### **For Users:**
- ✅ **Privacy**: Form data doesn't persist across browser sessions
- ✅ **Clean Slate**: Each new session starts fresh
- ✅ **No Manual Cleanup**: Data automatically cleared when tab closes

### **For Developers:**
- ✅ **Reduced Storage**: No accumulation of old form data
- ✅ **Simplified Testing**: Fresh state on each session
- ✅ **Better UX**: Users get a clean form experience

## Migration Notes

### **Existing Users:**
- Users with existing localStorage data will need to re-enter their information
- This is intentional for privacy and data freshness

### **Development:**
- Form data will be cleared when you refresh the page or close the tab
- This is the expected behavior for sessionStorage

## Testing

### **Verify SessionStorage Usage:**
```javascript
// In browser console
console.log('Form data in sessionStorage:', sessionStorage.getItem('formData'));
```

### **Test Data Persistence:**
1. Fill out the form
2. Refresh the page - data should persist
3. Close the tab and reopen - data should be cleared

### **Test Data Clearing:**
```javascript
// Clear form data manually
sessionStorage.removeItem('formData');
```

## Troubleshooting

### **Data Not Persisting on Refresh:**
- Check if sessionStorage is available in the browser
- Verify the data is being saved correctly
- Check for JavaScript errors in the console

### **Data Persisting Across Sessions:**
- Ensure you're using sessionStorage, not localStorage
- Check that the storage key is correct (`formData`)
- Verify the browser tab is actually closed

### **Performance Issues:**
- Large photo files are converted to base64 for storage
- Consider implementing file size limits if needed
- Monitor sessionStorage usage for very large forms

## Future Considerations

### **Potential Enhancements:**
1. **Compression**: Compress large form data before storage
2. **Selective Storage**: Only store essential fields
3. **Expiration**: Add timestamp-based expiration for sessionStorage
4. **Backup**: Implement localStorage backup for important data

### **Alternative Storage Options:**
- **IndexedDB**: For larger datasets
- **Cookies**: For server-side access
- **Memory Only**: For sensitive data that shouldn't persist 