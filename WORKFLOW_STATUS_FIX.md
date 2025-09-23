# Document Workflow Status Fix

## Problem Identified

The "All Documents" section was displaying ALL documents regardless of their workflow status (pending, under review, needs revision, etc.), instead of only showing approved/published documents.

## Root Cause

The development helper function `getDocumentsDev()` in `src/lib/supabase-dev-helper.ts` was missing the status filter `.eq('status', 'published')`, while the production code in `supabase.ts` had the correct filter.

## ✅ Solutions Implemented

### 1. **Fixed Development Helper Status Filtering**

- **File**: `src/lib/supabase-dev-helper.ts`
- **Change**: Added `.eq('status', 'published')` filter to `getDocumentsDev()`
- **Impact**: "All Documents" now only shows published documents in development

### 2. **Enhanced Status Filtering Logic**

- **Files**:
  - `src/lib/supabase-dev-helper.ts`
  - `src/lib/supabase.ts`
  - `src/services/documentService.ts`
- **Enhancement**: Added `includeUnpublished` parameter to handle different document views
- **Logic**:
  - **"All Documents"**: Only shows `status = 'published'`
  - **"My Uploads"**: Shows all user documents regardless of status
  - **Other categories**: Only shows published documents

### 3. **Updated Component Integration**

- **File**: `src/components/DocumentGrid.tsx`
- **Change**: Pass `includeUnpublished: true` for "My Uploads" category
- **Impact**: Users can see their own documents in all workflow stages

### 4. **Updated Hook Integration**

- **File**: `src/hooks/useDocuments.ts`
- **Change**: Added `includeUnpublished` parameter to interface and dependencies
- **Impact**: Proper re-fetching when switching between document views

## 🔄 Correct Workflow Flow

### Document Lifecycle:

1. **Student uploads document** → Status: `pending`
2. **Faculty reviews document** → Can set status to:
   - `under_review` (reviewing)
   - `needs_revision` (requires changes)
   - `approved`/`published` (ready for public view)
3. **Library staff curation** → Final quality checks
4. **Published documents** → Appear in "All Documents" for public access

### Document Visibility:

- **"All Documents"**: Only `status = 'published'` documents
- **"My Uploads"**: All user documents regardless of status
- **"Workflow Dashboard"**: Documents filtered by workflow status for reviewers
- **"Starred Documents"**: User's starred documents (published only)

## 🎯 Expected Behavior Now:

### For Students:

- Can see all their uploaded documents in "My Uploads" (pending, under review, published, etc.)
- Can only see published documents from other users in "All Documents"

### For Faculty/Advisers:

- Can review assigned documents through Workflow Dashboard
- Can approve/reject/request revisions
- Only approved documents appear in public "All Documents"

### For Library Staff:

- Can perform quality checks on approved documents
- Can enhance metadata before final publication
- Control final publication status

### For Public/General Users:

- Only see fully published documents in "All Documents"
- Clean, curated content without work-in-progress documents

## 📊 Status Values Used:

- `pending` - Newly uploaded, awaiting review
- `under_review` - Currently being reviewed by faculty
- `needs_revision` - Requires changes from student
- `approved` - Approved by faculty, ready for library curation
- `published` - Final status, visible to all users

## 🔧 Technical Implementation Details:

### Development vs Production:

- **Development**: Uses `devSupabaseHelpers.getDocumentsDev()` with status filtering
- **Production**: Uses `supabaseHelpers.getDocuments()` with existing status filtering
- Both now properly filter by document status

### Database Query Logic:

```sql
-- For "All Documents" and categories
SELECT * FROM documents WHERE status = 'published'

-- For "My Uploads"
SELECT * FROM documents WHERE user_id = $1
-- (no status filter - shows all user documents)
```

This fix ensures that the document repository follows proper academic workflow standards where only approved, published documents are visible to the general public, while users can track their own submissions through the complete workflow process.
