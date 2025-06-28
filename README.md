# IPTV Playlist Manager

Advanced IPTV M3U playlist management tool with smart channel detection, EPG management, and export capabilities.

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DigiSynthesis/iptv-playlist-manager)

## ⚡ Features

- **Smart M3U Parsing**: Automatically differentiates between TV channels and Movies/Shows
- **EPG Management**: Bulk assignment and search capabilities  
- **Export Options**: Download files or generate hosted URLs
- **Dark/Light Theme**: Responsive design with accessibility focus
- **Lazy Loading**: Efficient handling of large playlists in 50-channel batches
- **Group Organization**: Smart channel grouping with search and filtering

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS v3 + shadcn/ui
- **Build Tool**: Vite
- **Deployment**: Vercel

## 📦 Installation & Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

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

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
npm run build
npm run preview
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**: Import your repository in Vercel dashboard
2. **Configure Build**: Vercel will auto-detect the Vite configuration
3. **Deploy**: Automatic deployment on every push to main branch

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your hosting provider

## 🔧 Configuration

### Environment Variables

No environment variables required for basic functionality. The app works entirely client-side.

### Build Configuration

- **Framework**: Vite
- **Output Directory**: `dist`
- **Build Command**: `npm run build`
- **Install Command**: `npm install`

## 📱 Usage

1. **Import Playlist**: Upload your M3U file or paste M3U URL
2. **Manage Channels**: View channels grouped by category with lazy loading
3. **Assign EPG**: Add EPG URLs individually or in bulk
4. **Export Updates**: Download modified channels or generate hosted URLs

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

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the component library
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for icons
- [Vercel](https://vercel.com/) for hosting