import bcrypt from 'bcrypt';

// Database of users with HASHED passwords
// In production, this would be a real database (MongoDB, PostgreSQL, etc.)
// These passwords are hashed using bcrypt

export const users = [
  {
    id: 'INT-2024-001',
    username: 'intern_001',
    passwordHash: '$2b$10$K9.9.ZN5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', // Hash of 'Password@123'
    role: 'intern',
    fullName: 'Raj Kumar',
    email: 'raj.kumar@shiphy.com',
    department: 'Development',
    joinDate: '2024-01-15',
    employeeId: 'INT-2024-001',
    isBlocked: false,
    failedAttempts: 0,
  },
  {
    id: 'EMP-2022-045',
    username: 'emp_001',
    passwordHash: '$2b$10$L9.9.ZN5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', // Hash of 'EmpPass@456'
    role: 'employee',
    fullName: 'Priya Sharma',
    email: 'priya.sharma@shiphy.com',
    department: 'Engineering',
    joinDate: '2022-06-01',
    employeeId: 'EMP-2022-045',
    isBlocked: false,
    failedAttempts: 0,
  },
  {
    id: 'HR-2020-001',
    username: 'hr_team',
    passwordHash: '$2b$10$M9.9.ZN5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', // Hash of 'HR@9999'
    role: 'hr',
    fullName: 'HR Department',
    email: 'hr@shiphy.com',
    department: 'Human Resources',
    joinDate: '2020-01-01',
    employeeId: 'HR-2020-001',
    isBlocked: false,
    failedAttempts: 0,
  },
  {
    id: 'ADM-2019-001',
    username: 'admin_abhishek',
    passwordHash: '$2b$10$N9.9.ZN5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', // Hash of 'Admin@123'
    role: 'admin',
    fullName: 'Abhishek Shemadi',
    email: 'abhishek.shemadi@shiphy.com',
    department: 'Administration',
    joinDate: '2019-03-22',
    employeeId: 'ADM-2019-001',
    motherName: 'SHEETAL',
    isBlocked: false,
    failedAttempts: 0,
  },
  {
    id: 'BT-2023-001',
    username: 'blueteam_lead',
    passwordHash: '$2b$10$O9.9.ZN5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', // Hash of 'BlueTeam@123'
    role: 'blueteam',
    fullName: 'Blue Team Lead',
    email: 'blueteam@shiphy.com',
    department: 'Cybersecurity',
    joinDate: '2023-01-01',
    employeeId: 'BT-2023-001',
    isBlocked: false,
    failedAttempts: 0,
  },
  {
    id: 'CEO-2018-001',
    username: 'boss_shiphy',
    passwordHash: '$2b$10$P9.9.ZN5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', // Hash of 'Boss@2024'
    role: 'boss',
    fullName: 'Boss/CEO',
    email: 'boss@shiphy.com',
    department: 'Executive',
    joinDate: '2018-01-01',
    employeeId: 'CEO-2018-001',
    isBlocked: false,
    failedAttempts: 0,
  },
];

// Helper function to generate hashed passwords (for reference)
// Do NOT expose this in production - only use during initial setup
export async function generatePasswordHashes() {
  const passwords = {
    'intern_001': 'Password@123',
    'emp_001': 'EmpPass@456',
    'hr_team': 'HR@9999',
    'admin_abhishek': 'Admin@123',
    'blueteam_lead': 'BlueTeam@123',
    'boss_shiphy': 'Boss@2024',
  };

  console.log('Password hashes (for development reference):');
  for (const [username, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${username}: ${hash}`);
  }
}

// Find user by username
export function findUserByUsername(username) {
  return users.find(u => u.username === username);
}

// Find user by ID
export function findUserById(id) {
  return users.find(u => u.id === id);
}

// Get user without password hash
export function getUserPublicInfo(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}
