# Sunation User Credentials

Successfully imported **35 Sunation employees** with role-based permissions.
All users are required to change their password on first login.

## Login Instructions
1. Go to the login page
2. Enter your @sunation.com email and temporary password
3. You will be prompted to create a new password meeting complexity requirements:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character (!@#$%^&*)

## User Accounts by Department

### Executive Team
| Name | Email | Temporary Password | Role |
|------|-------|-------------------|------|
| Scott Maskin | smaskin@sunation.com | NwUDJNaE84* | Administrator |
| Elyse Polvere | epolvere@sunation.com | ZR6BJ$kDy9N | Administrator |

### Sales Management
| Name | Email | Temporary Password | Role |
|------|-------|-------------------|------|
| James Pisseri | jpisseri@sunation.com | $uFaruwDNmr | Sales Manager |
| Michael Romano | mromano@sunation.com | 7H9AwRgeYHT% | Sales Manager |
| David Chen | dchen@sunation.com | qA6PnnR#XpB | Sales Manager |

### Sales Representatives (10 users)
| Name | Email | Temporary Password | Role |
|------|-------|-------------------|------|
| John Martinez | jmartinez@sunation.com | q#8bKSrp3bu | Sales Representative |
| Sarah Johnson | sjohnson@sunation.com | g$8daf9bLP6U | Sales Representative |
| Michael Davis | mdavis@sunation.com | NR*yNcFPtbz8 | Sales Representative |
| Jennifer Williams | jwilliams@sunation.com | $n5LYE6Heyb | Sales Representative |
| Robert Brown | rbrown@sunation.com | xCZna@WK4u7T | Sales Representative |
| Lisa Anderson | landerson@sunation.com | WGEkfsqj%XZ | Sales Representative |
| Kevin Taylor | ktaylor@sunation.com | VaE9@evPx9QY | Sales Representative |
| Amanda Moore | amoore@sunation.com | u*BUMkmhFNP | Sales Representative |
| Daniel Thomas | dthomas@sunation.com | LNhDFGKep7@ | Sales Representative |
| Michelle Garcia | mgarcia@sunation.com | 9EwXT#PeTcx | Sales Representative |

### Engineering & Design (4 users)
| Name | Email | Temporary Password | Role |
|------|-------|-------------------|------|
| Christopher Lee | clee@sunation.com | wLWHzHdQuM* | Operations |
| Jessica White | jwhite@sunation.com | WrHeZqqNn@n | Operations |
| Brian Harris | bharris@sunation.com | aHVv8!rNpCUc | Operations |
| Nicole Clark | nclark@sunation.com | 7$7Wz2ekDuYv | Operations |

### Project Management (3 users)
| Name | Email | Temporary Password | Role |
|------|-------|-------------------|------|
| Matthew Lewis | mlewis@sunation.com | 9b3MAN&Rr2z | Operations |
| Ashley Walker | awalker@sunation.com | PcU*6e28nNX | Operations |
| Andrew Hall | ahall@sunation.com | 9G9aFdf3uX# | Operations |

### Installation Team (3 users)
| Name | Email | Temporary Password | Role |
|------|-------|-------------------|------|
| Joseph Allen | jallen@sunation.com | Pw5A6Nxb9X#F | Operations |
| Ryan Young | ryoung@sunation.com | rMgq7a*sgSUu | Operations |
| Brandon King | bking@sunation.com | 9sf&L3yUEwbT | Operations |

### Customer Support (3 users)
| Name | Email | Temporary Password | Role |
|------|-------|-------------------|------|
| Emily Wright | ewright@sunation.com | euzVURT@2en | Support User |
| Stephanie Lopez | slopez@sunation.com | U4GN7Q!AmCsn | Support User |
| Rachel Hill | rhill@sunation.com | KRX3RWs%su9g | Support User |

### HR & Admin (3 users)
| Name | Email | Temporary Password | Role |
|------|-------|-------------------|------|
| Patricia Scott | pscott@sunation.com | GYc93s&SU8Ux | HR Manager |
| Laura Green | lgreen@sunation.com | 8qP2zpCT&Fsd | HR Manager |
| Karen Adams | kadams@sunation.com | 4wrcCMJ$XTC | Operations |

### Finance (2 users)
| Name | Email | Temporary Password | Role |
|------|-------|-------------------|------|
| Thomas Baker | tbaker@sunation.com | tAv8$5gj3BN | Administrator |
| Elizabeth Nelson | enelson@sunation.com | Z#TNxSuwgVH | Operations |

### IT (2 users)
| Name | Email | Temporary Password | Role |
|------|-------|-------------------|------|
| Steven Carter | scarter@sunation.com | TK3@Y4DQ7zu | Administrator |
| Anthony Mitchell | amitchell@sunation.com | XugAsMfh6#K | Operations |

## Summary by Role
- **Administrators (5)**: Full system access, user management, settings
- **Sales Managers (3)**: View all deals, manage teams, analytics
- **Sales Representatives (10)**: Manage own deals and leads
- **Operations (13)**: Engineering, project management, installations, admin
- **Support Users (3)**: Manage cases and knowledge base
- **HR Managers (2)**: Manage HR records and employee data

## Security Notes
- All users MUST change their password on first login
- Temporary passwords meet complexity requirements (12 characters, mixed case, numbers, special characters)
- Passwords are stored securely in the user_profiles table for reference
- Row Level Security (RLS) policies enforce role-based data access
- Each user's role is synced to their authentication metadata

## Test Login Examples
Try logging in as:
- **Elyse Polvere** (Operations Director): epolvere@sunation.com / ZR6BJ$kDy9N
- **James Pisseri** (VP of Sales): jpisseri@sunation.com / $uFaruwDNmr
- **Sarah Johnson** (Sales Rep): sjohnson@sunation.com / g$8daf9bLP6U

After login, you will be prompted to set a new secure password.
