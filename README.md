# TARAS Student Monitoring System

A clean, modern, responsive, institutional student monitoring web application built for the **TARAS / SYMPo President**, with read-only access for **Staff** and **Students**.

The application enforces strict **Role-Based Access Control (RBAC)** at both the UI and Database/API levels. Non-President accounts are prevented from adding, editing, or deactivating student records even if direct API calls are attempted.

---

## 🌟 Key Features & Role Breakdown

### 👑 President (Full Control)
- **Dashboard & Directory**: Monitor all student records across departments, years, and sections.
- **Record Management**: Add new students, edit existing student details, and soft-deactivate students with confirmation.
- **TARAS Role Assignment**: Assign roles (`Volunteer`, `Coordinator`, `Member`, `None`).
- **Activity & Attendance**: Create campus events, workshops, meetings, and record student participation checklists.
- **Data Export**: Export student directory reports in CSV and formatted PDF/Print versions.
- **Audit Logs**: View an immutable log of all President modifications, student updates, and timestamped actions.
- **Privacy Settings**: Configure whether staff accounts can view private contact details (Phone/Email).

### 👩‍🏫 Staff (Read-Only)
- Login and view complete student directory with search, filtering, and sorting.
- View individual student profiles, academic information, and participation metrics.
- All edit, add, deactivate, and management controls are completely hidden.

### 🎓 Student (Read-Only)
- Login and view permitted student directory information.
- Restricted contact fields (Phone Number, Personal Email) are automatically masked.
- View TARAS events and participation overview.

---

## 🏗️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons, Recharts, React Router v6.
- **Backend**: FastAPI (Python), PyDantic schemas, RBAC middleware.
- **Database**: PostgreSQL / Supabase with Row Level Security (RLS) policies.
- **Hosting**: Netlify SPA ready (`netlify.toml` + `public/_redirects`).

---

## 📁 Repository Structure

```text
taras_app/
├── frontend/                 # React + TypeScript + Vite SPA
│   ├── public/               # Static assets & Netlify _redirects
│   ├── src/
│   │   ├── components/       # UI components (Header, Sidebar, Tables, Drawers, Modals)
│   │   ├── context/          # AuthContext, StudentContext, ToastContext
│   │   ├── pages/            # Login, Dashboard, Students, Activities, Reports, AuditLogs, Settings
│   │   ├── services/         # API service layer, Supabase client, Mock dataset
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/            # Formatters & CSV/PDF exporter
│   ├── package.json
│   ├── vite.config.ts
│   ├── netlify.toml
│   └── .env.example
├── backend/                  # FastAPI Python backend
│   ├── app/                  # Main app, routes, auth dependencies, schemas
│   ├── requirements.txt
│   └── .env.example
├── supabase/
│   └── schema.sql            # PostgreSQL tables, RLS policies & initial seed data
├── DEPLOYMENT.md             # Netlify & Supabase deployment documentation
└── README.md
```

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### 2. Run the FastAPI Backend (Optional)
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## 🔒 Security & RBAC Enforcement

1. **Frontend Role Guard**: Navigation links and mutation buttons (`+ Add Student`, `Edit`, `Deactivate`, `Track Attendance`) are conditionally rendered for `PRESIDENT` role only.
2. **Service Layer Guard**: The `apiService` enforces that any call to mutate data verifies `currentUserRole === 'PRESIDENT'`, throwing an error otherwise.
3. **Database RLS Policies**: `supabase/schema.sql` contains PostgreSQL Row Level Security policies ensuring `INSERT`, `UPDATE`, and `DELETE` queries are allowed ONLY when `auth.jwt() -> role == 'PRESIDENT'`.
