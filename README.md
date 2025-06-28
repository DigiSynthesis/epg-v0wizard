# IPTV Playlist Manager

Advanced IPTV M3U playlist management tool with smart channel detection, EPG management, cloud storage, and export capabilities.

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DigiSynthesis/iptv-playlist-manager)

## ⚡ Features

- **🔐 User Authentication**: Secure sign-up/sign-in with Supabase Auth
- **☁️ Cloud Storage**: Persistent EPG data storage with Supabase
- **🧠 Smart M3U Parsing**: Automatically differentiates between TV channels and Movies/Shows
- **📺 EPG Management**: Bulk assignment and search capabilities  
- **📤 Export Options**: Download files or generate persistent cloud URLs
- **🌙 Dark/Light Theme**: Responsive design with accessibility focus
- **⚡ Lazy Loading**: Efficient handling of large playlists in 50-channel batches
- **📁 Group Organization**: Smart channel grouping with search and filtering
- **🔄 Auto-Sync**: Changes automatically sync to your cloud storage

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS v3 + shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage)
- **Build Tool**: Vite
- **Deployment**: Vercel

## 📦 Installation & Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd iptv-playlist-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy `.env.example` to `.env.local`
   - Add your Supabase URL and anon key to `.env.local`
   - Run the SQL commands from `lib/database.sql` in your Supabase SQL editor
   - Create a storage bucket named `epg-playlists` with public access

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
npm run build
npm run preview
```

## 🔧 Supabase Setup

### 1. Database Schema

Run the SQL commands in `lib/database.sql` to create:
- `profiles` table for user data
- `epg_files` table for EPG file metadata
- Row Level Security (RLS) policies
- Automatic profile creation trigger

### 2. Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `epg-playlists`
3. Set it to public access
4. Configure policies to allow authenticated users to upload/update their own files

### 3. Authentication

1. Go to Authentication > Settings
2. Enable Email authentication
3. Disable email confirmation for easier testing (optional)
4. Configure any additional auth providers as needed

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**: Import your repository in Vercel dashboard
2. **Add Environment Variables**: 
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **Deploy**: Automatic deployment on every push to main branch

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your hosting provider

## 🔧 Environment Variables

Create a `.env.local` file with:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 Usage

1. **Sign Up/Sign In**: Create an account or sign in to access cloud features
2. **Import Playlist**: Upload your M3U file or paste M3U URL
3. **Manage Channels**: View channels grouped by category with lazy loading
4. **Assign EPG**: Add EPG URLs individually or in bulk
5. **Export Updates**: Download modified channels or generate persistent cloud URLs
6. **Cloud Sync**: Your changes are automatically saved to the cloud

## 🔒 Security Features

- **Row Level Security**: Users can only access their own data
- **Secure Authentication**: Powered by Supabase Auth
- **Environment Variables**: Sensitive data stored securely
- **HTTPS Only**: All communications encrypted

## 🎨 Customization

### Theme System

The app uses Tailwind CSS v3 with a comprehensive design system:

- **Colors**: HSL-based color variables for easy customization
- **Dark Mode**: Automatic theme switching with system preference
- **Accessibility**: WCAG compliant contrast ratios
- **Responsive**: Mobile-first design approach

### Component Library

Built with shadcn/ui components for consistency and maintainability:

- All components are customizable
- TypeScript support throughout
- Accessible by default

## 🔍 Smart M3U Parsing

The application intelligently detects content types:

- **TV Channels**: `http://server.com/channel/user/pass/12345`
- **Movies/Shows**: `http://server.com/movie/user/pass/12345.mkv`

Parsing stops automatically when movie content is detected to focus only on TV channels.

## 📊 Performance

- **Lazy Loading**: Handles large playlists efficiently
- **Batch Processing**: 50 channels per batch
- **Optimized Builds**: Code splitting and tree shaking
- **Fast Rendering**: Virtual scrolling for large lists
- **Cloud Caching**: Persistent storage reduces load times

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) for backend infrastructure
- [shadcn/ui](https://ui.shadcn.com/) for the component library
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for icons
- [Vercel](https://vercel.com/) for hosting