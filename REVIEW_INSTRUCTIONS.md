# 📋 UBrary Project Review Instructions

## 🎯 How to View & Review Your UBrary Project

### 🚀 **Quick Start - Running the Project**

1. **Open Terminal** in your project directory:

   ```bash
   cd "/Users/dinglasanefren/Desktop/Capstone - Ubrary"
   ```

2. **Install Dependencies** (if not done):

   ```bash
   npm install
   ```

3. **Start Development Server**:

   ```bash
   npm run dev
   ```

4. **Open in Browser**: Go to `http://localhost:5173`

---

## 🔐 **Login & User Roles**

Your UBrary system has **4 user roles** with different review capabilities:

### **1. Student Role** 👨‍🎓

- **Can**: View published documents, search, download
- **Cannot**: Review or approve documents

### **2. Faculty/Adviser Role** 👨‍🏫

- **Can**: Review student submissions, approve/reject, request revisions
- **Access**: Workflow Dashboard for document review

### **3. Library Staff Role** 📚

- **Can**: Final curation, metadata enhancement, quality control
- **Access**: Advanced workflow management

### **4. Admin Role** ⚙️

- **Can**: Everything - user management, system configuration
- **Access**: Complete system control

---

## 📊 **Document Review Workflow**

### **Step 1: Access Workflow Dashboard**

1. **Login** with Faculty, Library Staff, or Admin role
2. **Click "Workflow"** in the sidebar
3. **View documents** by status tabs:
   - **All** - All documents
   - **Pending** - New submissions
   - **Review** - Under review
   - **Revision** - Needs changes
   - **Approved** - Ready for curation
   - **Curation** - Being prepared
   - **Ready** - Ready to publish
   - **Published** - Live documents

### **Step 2: Review Process**

#### **For Faculty/Advisers:**

1. **Find Pending Documents** in the workflow dashboard
2. **Click "Start Review"** on a document
3. **Review Options**:
   - ✅ **Approve** - Move to approved status
   - 📝 **Needs Revision** - Send back for changes
   - 👁️ **View Document** - Open full document viewer

#### **For Library Staff:**

1. **Work with Approved Documents**
2. **Perform Quality Checks**:
   - Verify metadata completeness
   - Check formatting standards
   - Enhance Dublin Core metadata
3. **Move to Publication** when ready

---

## 🔍 **Document Viewing Options**

### **1. Grid View** (Default)

- **Card-based layout** with thumbnails
- **Quick actions**: Star, View, Download
- **Document info**: Title, authors, year, program

### **2. List View**

- **Detailed table format**
- **More metadata** visible at once
- **Bulk operations** support

### **3. Document Viewer**

- **Full-screen PDF viewer**
- **In-browser viewing** (no download required)
- **Navigation tools**: Zoom, print, share

---

## 🎨 **UI Features to Review**

### **Sidebar Navigation** 📂

- **All Documents** - Browse all published works
- **Recent** - Last 7 days uploads
- **Starred** - Your bookmarked documents ⭐
- **My Uploads** - Documents you've uploaded
- **Workflow** - Review dashboard (role-dependent)

### **Search & Filters** 🔍

- **Full-text search** across all documents
- **Year filter** - Filter by publication year
- **Program filter** - Filter by academic program
- **Sort options** - By date, title, author, downloads

### **Document Cards** 📄

- **Hover effects** with action buttons
- **Star functionality** - Bookmark documents
- **Download tracking** - View/download counts
- **Status badges** - Show workflow status

---

## 🧪 **Testing the Review System**

### **Test Scenario 1: Student Submission**

1. **Login as Student**
2. **Upload a thesis** using "Upload Thesis" button
3. **Fill metadata**: Title, authors, adviser, abstract, keywords
4. **Submit** - Document goes to "Pending" status

### **Test Scenario 2: Faculty Review**

1. **Login as Faculty**
2. **Go to Workflow Dashboard**
3. **Find the pending document**
4. **Start Review** and test approval/revision workflow

### **Test Scenario 3: Library Curation**

1. **Login as Library Staff**
2. **Access approved documents**
3. **Test curation workflow**
4. **Move to publication**

---

## 🔧 **Technical Features to Review**

### **Database Integration** 💾

- **Real-time counts** in sidebar
- **Persistent starred documents**
- **User authentication** with Supabase
- **File storage** and retrieval

### **Performance Features** ⚡

- **Lazy loading** of documents
- **Optimized queries** with pagination
- **Caching** of frequently accessed data
- **Responsive design** for mobile

### **Security Features** 🔒

- **Row Level Security (RLS)** policies
- **Role-based permissions**
- **Secure file access** with signed URLs
- **Authentication state management**

---

## 📱 **Mobile Responsiveness**

### **Test Different Screen Sizes**:

1. **Desktop** - Full sidebar and grid layout
2. **Tablet** - Collapsible sidebar
3. **Mobile** - Hamburger menu, optimized cards

---

## 🎯 **Key Areas to Focus Review On**

### **1. User Experience** 👥

- **Intuitive navigation**
- **Clear workflow steps**
- **Helpful feedback messages**
- **Loading states and error handling**

### **2. Functionality** ⚙️

- **Document upload process**
- **Review workflow accuracy**
- **Search and filtering**
- **Star/bookmark system**

### **3. Visual Design** 🎨

- **Professional appearance**
- **Consistent styling**
- **Clear status indicators**
- **Responsive layout**

### **4. Performance** 🚀

- **Fast loading times**
- **Smooth animations**
- **Efficient data fetching**
- **No memory leaks**

---

## 📋 **Review Checklist**

### **Before Starting Review:**

- [ ] Run the database setup script (`supabase/complete_database_setup.sql`)
- [ ] Verify all dependencies are installed
- [ ] Test with different user roles
- [ ] Check mobile responsiveness

### **During Review:**

- [ ] Test complete workflow (submit → review → publish)
- [ ] Verify all CRUD operations work
- [ ] Check error handling
- [ ] Test search and filtering
- [ ] Verify starred documents functionality
- [ ] Test file upload and viewing

### **Final Checks:**

- [ ] No console errors
- [ ] All features working as expected
- [ ] Professional appearance
- [ ] Good performance on different devices

---

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **404 Errors** - Run the database setup script
2. **Authentication Issues** - Check Supabase configuration
3. **File Upload Problems** - Verify storage policies
4. **Sidebar Counts Wrong** - Refresh after database changes

### **Need Help?**

- Check browser console for errors
- Verify database functions exist
- Test with different user roles
- Clear browser cache if needed

---

## 🎉 **You're Ready!**

Your UBrary project is a comprehensive digital repository system with:

- ✅ **4-step workflow** (Submit → Review → Curate → Publish)
- ✅ **Role-based permissions**
- ✅ **Advanced search** and filtering
- ✅ **Document starring** system
- ✅ **Mobile-responsive** design
- ✅ **Professional UI/UX**

**Happy reviewing! 🚀📚**
