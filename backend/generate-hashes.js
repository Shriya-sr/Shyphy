import bcrypt from 'bcrypt';

const passwords = {
  'intern_001': 'Password@123',
  'emp_001': 'EmpPass@456',
  'hr_team': 'HR@9999',
  'admin_abhishek': 'Admin@123',
  'blueteam_lead': 'BlueTeam@123',
  'boss_shiphy': 'Boss@2024',
};

async function generateHashes() {
  console.log('const PRECOMPUTED_HASHES = {');
  for (const [user, pass] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(pass, 10);
    console.log(`  '${user}': '${hash}',`);
  }
  console.log('};');
}

generateHashes().catch(console.error);
