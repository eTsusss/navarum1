# Navarum - E-commerce Website

A modern e-commerce website with a client-server architecture featuring a shopping cart, user profiles, and product management.

## ⚠️ Important Notice

**User registration is currently disabled.** Only the administrator can access the system.

### Admin Access
- **Username:** `navarum_admin_2025`
- **Password:** `K9#mP$2vL@7nQ!8xR&5tY*3wE`

## Project Structure

```
navarum/
├── client/          # Frontend files (HTML, CSS, JavaScript)
├── server/          # Backend Python Flask application
├── fix/             # Documentation and fixes
└── ADMIN_CREDENTIALS.md  # Admin credentials and changes log
└── CONTENT_MANAGEMENT_SYSTEM.md  # Content management system documentation
```

## Features

- **Product Catalog**: Display and manage product listings with prices
- **Content Management System**: Edit all page content directly from browser (admin only)
- **User Profiles**: User account management and profile customization (admin only)
- **Responsive Design**: Modern, mobile-friendly interface
- **Backend API**: RESTful API for data management
- **Admin Panel**: Product management for administrators
- **Price Management**: Admin can modify product prices

## Technologies Used

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript

### Backend
- Python Flask
- SQLite Database
- JWT Authentication
- bcrypt Password Hashing

## Getting Started

### Prerequisites
- Python 3.7+
- Web browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/eTsusss/work-site.git
cd work-site
```

2. Install Python dependencies:
```bash
cd server
pip install -r requirements.txt
```

3. Run the server:
```bash
python app.py
```

4. Open the client files in your web browser:
   - Navigate to the `client` folder
   - Open `index.html` in your browser

## Usage

1. **Browse Products**: View available products with prices on the main page
2. **Admin Login**: Use admin credentials to access the system
3. **Content Management**: Double-click any text element to edit it (admin only)
4. **Product Management**: Admin can add, edit, and remove products
5. **Price Management**: Admin can modify product prices
6. **User Profile**: Access profile to manage account settings (admin only)
7. **Admin Functions**: Manage products and system settings (admin only)

## API Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/products` - Get all products
- `PUT /api/profile` - Update user profile
- `POST /api/admin/products` - Add new product (admin only)
- `PUT /api/admin/products/<id>` - Update product (admin only)
- `DELETE /api/admin/products/<id>` - Delete product (admin only)

### Content Management API
- `GET /api/content` - Get all page content
- `GET /api/content/<section>/<key>` - Get specific content item
- `PUT /api/content/<section>/<key>` - Update content item (admin only)
- `PUT /api/content/batch` - Batch update content (admin only)
- `GET /api/content/sections` - Get content sections list
- `GET /api/content/section/<section>` - Get section content

**Note**: Shopping cart and order APIs have been disabled.

## Security Features

- JWT token-based authentication
- bcrypt password hashing
- Admin-only access to sensitive operations
- CORS protection
- Input validation and sanitization

## Recent Changes

- User registration has been disabled
- Test user account removed
- Enhanced admin security with complex credentials
- Simplified authentication flow
- **Shopping cart functionality completely disabled**
- **Order management system disabled**
- **Product prices remain visible and editable by admin**
- **Content Management System added** - Admin can edit all page content directly from browser

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

For questions or support, please open an issue on GitHub.
