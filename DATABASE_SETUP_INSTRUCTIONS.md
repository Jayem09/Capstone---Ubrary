# 🚨 URGENT: Database Setup Required

## **Your app is showing errors because the database is not set up!**

### **❌ Current Issues:**

- `starred_documents` table missing (406 errors)
- `get_documents_by_workflow_status` function missing (404 errors)
- `document_reviews` table missing (404 errors)
- `document_revision_requests` table missing (404 errors)

---

## **✅ SOLUTION - Run Database Setup:**

### **Step 1: Open Supabase Dashboard**

1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Open your UBrary project

### **Step 2: Open SQL Editor**

1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**

### **Step 3: Copy & Run the Setup Script**

1. **Open this file**: `supabase/complete_database_setup.sql`
2. **Copy ALL the contents** (365+ lines)
3. **Paste into Supabase SQL Editor**
4. **Click "RUN"** button

### **Step 4: Verify Success**

You should see a success message like:

```
Database setup complete!
Created starred_documents table with functions
Created workflow functions
All permissions granted
```

---

## **🎯 What This Script Does:**

### **Creates Missing Tables:**

- ✅ `starred_documents` - For bookmarking documents
- ✅ `document_reviews` - For faculty reviews
- ✅ `document_revision_requests` - For revision requests

### **Creates Missing Functions:**

- ✅ `toggle_document_star()` - Star/unstar documents
- ✅ `get_starred_documents()` - Get user's starred docs
- ✅ `get_documents_by_workflow_status()` - Workflow queries

### **Sets Up Security:**

- ✅ Row Level Security (RLS) policies
- ✅ Proper user permissions
- ✅ Secure access controls

---

## **🔄 After Running the Script:**

1. **Refresh your app** in the browser
2. **Check console** - errors should be gone!
3. **Test starring** - click star icons on documents
4. **Test workflow** - switch to Faculty role and check workflow
5. **Verify sidebar counts** - should show real numbers

---

## **🆘 If You Get Errors:**

### **"Function already exists" errors:**

- ✅ **Ignore these** - the script handles them with `IF NOT EXISTS`

### **"Permission denied" errors:**

- ❌ **Contact support** - you might need admin access to your Supabase project

### **"Table already exists" errors:**

- ✅ **Ignore these** - the script is safe to run multiple times

---

## **📞 Need Help?**

If the setup fails:

1. **Copy the error message**
2. **Check your Supabase project permissions**
3. **Try running the script in smaller chunks**
4. **Make sure you're signed in as project owner**

---

## **🎉 After Success:**

Your UBrary app will have:

- ⭐ **Working starred documents**
- 📊 **Accurate sidebar counts**
- 🔄 **Functioning workflow system**
- 👥 **Proper role-based permissions**
- 📝 **Document review system**

**Run the script now to fix all the errors! 🚀**
