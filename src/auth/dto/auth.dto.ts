export class RegisterDto {
  // 🧍 User info
  name!: string;
  email?: string;
  phone?: string;
  password!: string;
  role?: string;

  // 🏫 Institute info
  instituteCode?: string;   // for non-director users (join existing)
  instituteName?: string;   // for director creating new
  city?: string;

  // 🏢 Branch info
  branch?: {
    name: string;
    city?: string;
    code?: string;
    principalEmail?: string;
    packageTier?: string;
  };

  branches?: {
    name: string;
    city?: string;
    code?: string;
    principalEmail?: string;
    packageTier?: string;
  }[];
}

// src/auth/dto/create-institute.dto.ts
export class CreateInstituteDto {
  // Director Info
  directorName!: string;
  directorEmail!: string;
  directorPhone?: string;
  directorCnic?: string;
  password!: string;
  confirmPassword?: string;

  // Institute Info
  instituteName!: string;
  address?: string;
  city?: string;
  campusType?: string;
  instituteType?: string;
  establishedYear?: string;
  registrationNo?: string;

  // Location fields
  country?: string;
  province?: string;
  zone?: string;              // ✅ For Islamabad & similar regions
  sector?: string;
  subSector?: string;
  division?: string;
  district?: string;
  tehsil?: string;
  unionCouncil?: string;
  village?: string;

  // Optional default role users
  principal?: { name?: string; cnic?: string; email?: string; phone?: string };
  vicePrincipal?: { name?: string; cnic?: string; email?: string; phone?: string };
  admin?: { name?: string; cnic?: string; email?: string; phone?: string };
}



// export class CreateInstituteDto {
//   // 🧑‍💼 Director Info
//   directorName!: string;
//   directorEmail!: string;
//   directorPhone!: string;
//   directorCnic?: string;
//   password!: string;
//   confirmPassword?: string;

//   // 🏫 Institute Info
//   instituteName!: string;
//   city?: string;
//   branch?: string;
//   instituteType?: string;
//   establishedYear?: string;
//   registrationNo?: string;

//   // 👨‍🏫 Principal
//   principal?: {
//     name: string;
//     cnic?: string;
//     email?: string;
//     phone?: string;
//   };

//   // 👩‍💼 Vice Principal
//   vicePrincipal?: {
//     name: string;
//     cnic?: string;
//     email?: string;
//     phone?: string;
//   };

//   // 🧑‍💻 Admin / Manager
//   admin?: {
//     name: string;
//     cnic?: string;
//     email?: string;
//     phone?: string;
//   };
// }

export class createUserDto {
  name!: string;
  email?: string;
  phone?: string;
  password!: string;
  role!: string;
  instituteId!: string;
  cnic?: string;
}



export class LoginDto {
  emailOrPhone!: string;
  password!: string;
}
