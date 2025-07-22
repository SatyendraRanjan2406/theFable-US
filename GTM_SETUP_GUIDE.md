# Google Tag Manager (GTM) Setup Guide for StoryMaker

## ✅ COMPLETED: GTM Integration in Code

The following has been implemented in your StoryMaker app:

### 1. GTM Container Code Added ✅
- **GTM Script**: Added to `index.html` in `<head>` section
- **GTM Noscript**: Added to `index.html` after opening `<body>` tag
- **GTM Container ID**: `GTM-TX8M29ZP`

### 2. GTM Utility Functions Created ✅
- **File**: `src/utils/gtm.ts`
- **Functions**: Complete tracking utilities for all StoryMaker events
- **Events Tracked**:
  - `story_creation_started`
  - `photo_uploaded`
  - `story_customized`
  - `checkout_started`
  - `purchase_completed`
  - `story_viewed`
  - `story_shared`
  - `story_template_selected`
  - `carousel_interaction`

### 3. Tracking Implementation ✅
- **Main CTA Button**: Tracks when "CREATE YOUR STORY NOW" is clicked
- **Story Template Selection**: Tracks when users select story templates
- **Image Carousel**: Tracks carousel interactions (clicks, navigation, auto-rotation)

---

## 🔧 TODO: Complete GTM Dashboard Setup

Follow these steps to complete the GTM setup:

### Step 1: Create GTM Container
1. Go to [Google Tag Manager](https://tagmanager.google.com)
2. Create account for `storymaker.jcool.in`
3. Verify container ID is `GTM-TX8M29ZP` (already implemented in code)

### Step 2: Connect GA4 with GTM
1. In GTM, go to **Tags** → **New**
2. Choose **Google Analytics: GA4 Configuration**
3. Enter your GA4 Measurement ID (format: `G-XXXXXXXXX`)
4. Set **Trigger**: `All Pages`
5. **Save** and **Submit**

### Step 3: Create Event Tags for StoryMaker Events

Create these tags in GTM to capture the custom events:

#### A. Story Creation Started
```
Tag Type: GA4 Event
Event Name: story_creation_started
Parameters:
  - event_category: {{ Event Category }}
  - event_label: {{ Event Label }}
Trigger: Custom Event = story_creation_started
```

#### B. Photo Uploaded
```
Tag Type: GA4 Event
Event Name: photo_uploaded
Parameters:
  - event_category: {{ Event Category }}
  - event_label: {{ Event Label }}
Trigger: Custom Event = photo_uploaded
```

#### C. Story Customized
```
Tag Type: GA4 Event
Event Name: story_customized
Parameters:
  - event_category: {{ Event Category }}
  - event_label: {{ Event Label }}
Trigger: Custom Event = story_customized
```

#### D. Checkout Started
```
Tag Type: GA4 Event
Event Name: checkout_started
Parameters:
  - event_category: {{ Event Category }}
  - event_label: {{ Event Label }}
  - value: {{ Event Value }}
  - currency: {{ Event Currency }}
Trigger: Custom Event = checkout_started
```

#### E. Purchase Completed
```
Tag Type: GA4 Event
Event Name: purchase_completed
Parameters:
  - event_category: {{ Event Category }}
  - event_label: {{ Event Label }}
  - transaction_id: {{ Transaction ID }}
  - value: {{ Event Value }}
  - currency: {{ Event Currency }}
Trigger: Custom Event = purchase_completed
```

#### F. Story Template Selected
```
Tag Type: GA4 Event
Event Name: story_template_selected
Parameters:
  - event_category: {{ Event Category }}
  - event_label: {{ Event Label }}
Trigger: Custom Event = story_template_selected
```

#### G. Carousel Interaction
```
Tag Type: GA4 Event
Event Name: carousel_interaction
Parameters:
  - event_category: {{ Event Category }}
  - event_label: {{ Event Label }}
  - image_index: {{ Image Index }}
Trigger: Custom Event = carousel_interaction
```

### Step 4: Create Variables (if needed)
In GTM, go to **Variables** → **New** → **Data Layer Variable**:
- `Event Category`
- `Event Label`
- `Event Value`
- `Event Currency`
- `Transaction ID`
- `Image Index`

### Step 5: Create Triggers
In GTM, go to **Triggers** → **New** → **Custom Event**:
- `story_creation_started`
- `photo_uploaded`
- `story_customized`
- `checkout_started`
- `purchase_completed`
- `story_template_selected`
- `carousel_interaction`

### Step 6: Test Implementation
1. **Preview Mode**: Use GTM Preview mode to test
2. **Real-time Reports**: Check GA4 Real-time events
3. **Debug**: Check browser console for GTM events

### Step 7: Publish Container
1. Click **Submit** in GTM
2. Add version name: "StoryMaker Launch v1.0"
3. Add description: "Initial GTM setup with custom event tracking"
4. **Publish**

---

## 📊 Events You'll See in GA4

Once setup is complete, you'll see these events in GA4:

### Engagement Events
- `story_creation_started` - When users click main CTA
- `photo_uploaded` - When users upload photos
- `story_customized` - When users customize stories
- `story_template_selected` - When users select story templates
- `carousel_interaction` - When users interact with image carousel
- `story_viewed` - When users view completed stories
- `story_shared` - When users share stories

### E-commerce Events
- `checkout_started` - When users start checkout
- `purchase_completed` - When users complete purchase

---

## 🚀 Additional Tracking Recommendations

### Enhanced E-commerce
Consider adding these events for better e-commerce tracking:
- `add_to_cart` - When users add story to cart
- `view_item` - When users view story details
- `begin_checkout` - When users enter checkout flow

### User Engagement
- `scroll` - Track scroll depth
- `file_download` - Track PDF downloads
- `video_play` - If you add video content

### Custom Dimensions
Set up custom dimensions in GA4 for:
- Story Type
- User Age Group
- Character Name
- Story Theme

---

## 🔍 Testing Commands

To test GTM implementation:

```javascript
// Open browser console and run:
window.dataLayer // Should show array with events

// Check if GTM is loaded:
window.google_tag_manager // Should exist

// Manually trigger test event:
window.dataLayer.push({
  event: 'story_creation_started',
  event_category: 'engagement',
  event_label: 'test'
});
```

---

## 📞 Support

If you need help with GTM setup:
1. Check GTM Preview mode for debugging
2. Use GA4 Real-time reports to verify events
3. Check browser console for any JavaScript errors
4. Verify all triggers are properly configured

---

## 🎯 Success Metrics to Track

With this GTM setup, you can track:
- **Conversion Rate**: Users who complete story creation
- **Template Popularity**: Which story templates are most popular
- **User Journey**: How users navigate through the app
- **Revenue**: E-commerce tracking for purchases
- **Engagement**: Carousel interactions and template selections

The GTM implementation is now complete and ready to track all user interactions on your StoryMaker app! 