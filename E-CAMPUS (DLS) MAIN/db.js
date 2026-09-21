const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

// Pre-seeded test users
const initialUsers = [
  {
    id: 1,
    username: "student_001",
    password: bcrypt.hashSync("student123", 10),
    email: "student_001@study-world.edu.in",
    phone: "9876543210",
    role: "student",
    full_name: "Student One",
    department: "CSE",
    otp: null,
    otp_expires: null,
    otp_attempts: 0,
    created_at: new Date()
  },
  {
    id: 2,
    username: "faculty_001",
    password: bcrypt.hashSync("faculty123", 10),
    email: "faculty@study-world.edu.in",
    phone: "9876543211",
    role: "faculty",
    full_name: "Faculty One",
    department: "CSE",
    otp: null,
    otp_expires: null,
    otp_attempts: 0,
    created_at: new Date()
  },
  {
    id: 3,
    username: "hod_001",
    password: bcrypt.hashSync("hod123", 10),
    email: "hod@study-world.edu.in",
    phone: "9876543212",
    role: "hod",
    full_name: "HOD CSE",
    department: "CSE",
    otp: null,
    otp_expires: null,
    otp_attempts: 0,
    created_at: new Date()
  },
  {
    id: 4,
    username: "principal_001",
    password: bcrypt.hashSync("principal123", 10),
    email: "principal@study-world.edu.in",
    phone: "9876543213",
    role: "principal",
    full_name: "Principal Dr. Kumar",
    department: "ADMIN",
    otp: null,
    otp_expires: null,
    otp_attempts: 0,
    created_at: new Date()
  },
  {
    id: 5,
    username: "admin",
    password: bcrypt.hashSync("admin123", 10),
    email: "admin@study-world.edu.in",
    phone: "9876543214",
    role: "admin",
    full_name: "System Admin",
    department: "ADMIN",
    otp: null,
    otp_expires: null,
    otp_attempts: 0,
    created_at: new Date()
  },
  {
    id: 6,
    username: "sakthi",
    password: bcrypt.hashSync("2006", 10),
    email: "sakthi@study-world.edu.in",
    phone: "9876543215",
    role: "admin",
    full_name: "Sakthi Admin",
    department: "ADMIN",
    otp: null,
    otp_expires: null,
    otp_attempts: 0,
    created_at: new Date()
  }
];

// Pre-seeded leaves for workflow testing
const initialLeaves = [
  {
    id: 1,
    leave_id: 1,
    student_id: 1,
    user_id: 1,
    username: "student_001",
    fromDate: "2026-05-10",
    from_date: "2026-05-10",
    toDate: "2026-05-12",
    to_date: "2026-05-12",
    reason: "Personal commitment",
    department: "CSE",
    status: "pending",
    current_approval_stage: "faculty",
    created_at: new Date()
  },
  {
    id: 2,
    leave_id: 2,
    student_id: 1,
    user_id: 1,
    username: "student_001",
    fromDate: "2026-05-15",
    from_date: "2026-05-15",
    toDate: "2026-05-17",
    to_date: "2026-05-17",
    reason: "Medical checkup",
    department: "CSE",
    status: "pending",
    current_approval_stage: "faculty",
    created_at: new Date()
  }
];

const inMemoryStore = {
  users: [...initialUsers],
  leaves: [...initialLeaves],
  notifications: [],
  activity_log: []
};

// In-memory SQL query simulator
async function executeMockQuery(sql, params = []) {
  const normSql = sql.trim().replace(/\s+/g, " ");
  const upper = normSql.toUpperCase();

  // Test query SELECT 1
  if (upper.startsWith("SELECT 1")) {
    return [[{ 1: 1 }], []];
  }

  // COUNT queries
  if (upper.includes("SELECT COUNT(*)")) {
    if (upper.includes("FROM NOTIFICATIONS") && upper.includes("IS_READ = FALSE")) {
      const uid = Number(params[0]);
      const count = inMemoryStore.notifications.filter(n => n.user_id === uid && !n.is_read).length;
      return [[{ count }], []];
    }
    if (upper.includes("FROM USERS")) {
      return [[{ count: inMemoryStore.users.length }], []];
    }
    if (upper.includes("FROM LEAVES")) {
      return [[{ count: inMemoryStore.leaves.length }], []];
    }
    if (upper.includes("FROM NOTIFICATIONS")) {
      return [[{ count: inMemoryStore.notifications.length }], []];
    }
  }

  // Analytics query on leaves
  if (upper.includes("COUNT(CASE WHEN STATUS = 'APPROVED'") || (upper.includes("FROM LEAVES") && upper.includes("COUNT(CASE WHEN"))) {
    const approved = inMemoryStore.leaves.filter(l => l.status === 'approved').length;
    const rejected = inMemoryStore.leaves.filter(l => l.status === 'rejected').length;
    const pending = inMemoryStore.leaves.filter(l => l.status === 'pending').length;
    const forwarded = inMemoryStore.leaves.filter(l => l.status === 'forwarded').length;
    return [[{ approved, rejected, pending, forwarded, total: inMemoryStore.leaves.length }], []];
  }

  if (upper.includes("FROM LEAVES") && upper.includes("GROUP BY")) {
    const counts = {};
    inMemoryStore.leaves.forEach(l => {
      counts[l.status] = (counts[l.status] || 0) + 1;
    });
    const stats = Object.keys(counts).map(st => ({
      status: st,
      count: counts[st],
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    }));
    return [stats, []];
  }

  // SELECT FROM NOTIFICATIONS
  if (upper.startsWith("SELECT") && upper.includes("FROM NOTIFICATIONS")) {
    let result = [...inMemoryStore.notifications];
    if (upper.includes("WHERE USER_ID = ?")) {
      const uid = Number(params[0]);
      result = result.filter(n => n.user_id === uid);
    }
    const limit = params[1] ? Number(params[1]) : result.length;
    return [result.slice(0, limit), []];
  }

  // INSERT INTO NOTIFICATIONS
  if (upper.startsWith("INSERT INTO NOTIFICATIONS")) {
    const newNotif = {
      id: inMemoryStore.notifications.length + 1,
      user_id: params[0],
      actor_id: params[1],
      leave_id: params[2],
      notification_type: params[3],
      title: params[4],
      message: params[5],
      action_url: params[6] || "",
      is_read: false,
      status: "unread",
      created_at: new Date()
    };
    inMemoryStore.notifications.unshift(newNotif);
    return [{ insertId: newNotif.id, affectedRows: 1 }, []];
  }

  // UPDATE NOTIFICATIONS
  if (upper.startsWith("UPDATE NOTIFICATIONS")) {
    if (upper.includes("SET IS_READ = TRUE")) {
      const nid = Number(params[0]);
      const item = inMemoryStore.notifications.find(n => n.id === nid);
      if (item) {
        item.is_read = true;
        item.status = "read";
      }
    }
    return [{ affectedRows: 1 }, []];
  }

  // SELECT FROM ACTIVITY_LOG
  if (upper.startsWith("SELECT") && upper.includes("FROM ACTIVITY_LOG")) {
    const limit = params[0] ? Number(params[0]) : 50;
    const offset = params[1] ? Number(params[1]) : 0;
    return [inMemoryStore.activity_log.slice(offset, offset + limit), []];
  }

  // INSERT INTO ACTIVITY_LOG
  if (upper.startsWith("INSERT INTO ACTIVITY_LOG")) {
    const newLog = {
      id: inMemoryStore.activity_log.length + 1,
      user_id: params[0],
      action: params[1],
      table_name: params[2],
      record_id: params[3],
      old_values: params[4],
      created_at: new Date()
    };
    inMemoryStore.activity_log.unshift(newLog);
    return [{ insertId: newLog.id, affectedRows: 1 }, []];
  }

  // SELECT FROM USERS
  if (upper.startsWith("SELECT") && upper.includes("FROM USERS")) {
    let result = [...inMemoryStore.users];

    if (upper.includes("AND OTP = ?")) {
      const val = String(params[0] || "").toLowerCase();
      const otpVal = String(params[3] || "");
      result = result.filter(u =>
        ((u.email && u.email.toLowerCase() === val) ||
         (u.username && u.username.toLowerCase() === val) ||
         (u.phone && u.phone === val)) &&
        (String(u.otp) === otpVal)
      );
    } else if (upper.includes("LOWER(USERNAME) = LOWER(?) OR LOWER(EMAIL) = LOWER(?)") ||
               upper.includes("USERNAME = ? OR EMAIL = ?") ||
               upper.includes("EMAIL = ? OR USERNAME = ?")) {
      const val0 = String(params[0] || "").toLowerCase();
      const val1 = String(params[1] || val0).toLowerCase();
      result = result.filter(u =>
        (u.username && u.username.toLowerCase() === val0) ||
        (u.email && u.email.toLowerCase() === val1) ||
        (u.username && u.username.toLowerCase() === val1) ||
        (u.email && u.email.toLowerCase() === val0)
      );
    } else if (upper.includes("WHERE EMAIL = ? OR USERNAME = ? OR PHONE = ?")) {
      const val = String(params[0] || "").toLowerCase();
      result = result.filter(u =>
        (u.email && u.email.toLowerCase() === val) ||
        (u.username && u.username.toLowerCase() === val) ||
        (u.phone && u.phone === val)
      );
    } else if (upper.includes("WHERE USERNAME = ?")) {
      const val = String(params[0] || "").toLowerCase();
      result = result.filter(u => u.username && u.username.toLowerCase() === val);
    } else if (upper.includes("WHERE EMAIL = ?")) {
      const val = String(params[0] || "").toLowerCase();
      result = result.filter(u => u.email && u.email.toLowerCase() === val);
    } else if (upper.includes("WHERE ROLE = 'ADMIN'")) {
      result = result.filter(u => u.role === "admin");
    } else if (upper.includes("WHERE ROLE = ?")) {
      result = result.filter(u => u.role === params[0]);
    } else if (upper.includes("WHERE ID = ?")) {
      result = result.filter(u => u.id === Number(params[0]));
    }
    return [result, []];
  }

  // INSERT INTO USERS
  if (upper.startsWith("INSERT INTO USERS")) {
    const newId = inMemoryStore.users.length + 1;
    let newUser = { id: newId, created_at: new Date() };

    if (params.length >= 5) {
      newUser.username = params[0];
      newUser.password = params[1];
      newUser.email = params[2];
      newUser.phone = params[3];
      newUser.role = params[4];
      newUser.full_name = params[5] || newUser.username;
      newUser.department = params[6] || "General";
    }
    inMemoryStore.users.push(newUser);
    return [{ insertId: newId, affectedRows: 1 }, []];
  }

  // UPDATE USERS
  if (upper.startsWith("UPDATE USERS")) {
    if (upper.includes("SET OTP = ?")) {
      const otp = params[0];
      const expires = params[1];
      const userId = params[2];
      const u = inMemoryStore.users.find(x => x.id === Number(userId));
      if (u) {
        u.otp = otp;
        u.otp_expires = expires;
        u.otp_attempts = 0;
      }
    } else if (upper.includes("SET PASSWORD = ?")) {
      const newPass = params[0];
      const username = params[1];
      const u = inMemoryStore.users.find(x => x.username === username || x.email === username);
      if (u) u.password = newPass;
    }
    return [{ affectedRows: 1 }, []];
  }

  // SELECT FROM LEAVES
  if (upper.startsWith("SELECT") && upper.includes("FROM LEAVES")) {
    let result = [...inMemoryStore.leaves];

    if (upper.includes("WHERE LEAVE_ID = ?") || upper.includes("WHERE ID = ?")) {
      const id = Number(params[0]);
      result = result.filter(l => l.leave_id === id || l.id === id);
    } else if (upper.includes("CURRENT_APPROVAL_STAGE = 'FACULTY'") && upper.includes("STATUS = 'PENDING'")) {
      result = result.filter(l => l.status === 'pending' && (l.current_approval_stage === 'faculty' || !l.current_approval_stage));
    } else if (upper.includes("CURRENT_APPROVAL_STAGE = 'HOD'") && upper.includes("STATUS = 'FORWARDED'")) {
      result = result.filter(l => l.status === 'forwarded' && l.current_approval_stage === 'hod');
    } else if (upper.includes("CURRENT_APPROVAL_STAGE = 'PRINCIPAL'") && upper.includes("STATUS = 'FORWARDED'")) {
      result = result.filter(l => l.status === 'forwarded' && l.current_approval_stage === 'principal');
    } else if (upper.includes("STATUS = 'PENDING' OR STATUS = 'FORWARDED'") || upper.includes("STATUS = 'PENDING'") && upper.includes("STATUS = 'FORWARDED'")) {
      result = result.filter(l => l.status === 'pending' || l.status === 'forwarded');
    } else if (upper.includes("WHERE USERNAME = ?")) {
      const un = String(params[0]).toLowerCase();
      result = result.filter(l => l.username && l.username.toLowerCase() === un);
    } else if (upper.includes("WHERE DEPARTMENT = ?")) {
      const dept = String(params[0]).toLowerCase();
      result = result.filter(l => l.department && l.department.toLowerCase() === dept);
    } else if (upper.includes("WHERE LOWER(STATUS) = ?") || upper.includes("WHERE STATUS = ?")) {
      const st = String(params[0]).toLowerCase();
      result = result.filter(l => l.status && l.status.toLowerCase() === st);
    }
    return [result, []];
  }

  // INSERT INTO LEAVES
  if (upper.startsWith("INSERT INTO LEAVES")) {
    const newId = inMemoryStore.leaves.length + 1;
    const newLeave = {
      id: newId,
      leave_id: newId,
      status: "pending",
      current_approval_stage: "faculty",
      created_at: new Date()
    };
    if (params.length === 5) {
      newLeave.username = params[0];
      newLeave.fromDate = params[1];
      newLeave.from_date = params[1];
      newLeave.toDate = params[2];
      newLeave.to_date = params[2];
      newLeave.reason = params[3];
      newLeave.department = params[4] || "CSE";
    } else if (params.length >= 6) {
      newLeave.student_id = params[0];
      newLeave.user_id = params[0];
      newLeave.username = params[1];
      newLeave.fromDate = params[2];
      newLeave.from_date = params[2];
      newLeave.toDate = params[3];
      newLeave.to_date = params[3];
      newLeave.reason = params[4];
      newLeave.department = params[5] || "CSE";
      newLeave.current_approval_stage = params[6] || "faculty";
    }
    inMemoryStore.leaves.unshift(newLeave);
    return [{ insertId: newId, affectedRows: 1 }, []];
  }

  // UPDATE LEAVES
  if (upper.startsWith("UPDATE LEAVES")) {
    const leaveId = Number(params[params.length - 1]);
    const l = inMemoryStore.leaves.find(x => x.leave_id === leaveId || x.id === leaveId);
    if (l) {
      if (upper.includes("STATUS = 'APPROVED'")) {
        l.status = "approved";
        l.approved_by = params[0];
        l.approved_at = new Date();
      } else if (upper.includes("STATUS = 'REJECTED'")) {
        l.status = "rejected";
        l.rejected_by = params[0];
        l.rejection_reason = params[1] || "";
        l.rejected_at = new Date();
      } else if (upper.includes("STATUS = 'FORWARDED'")) {
        l.status = "forwarded";
        if (upper.includes("CURRENT_APPROVAL_STAGE = 'HOD'")) {
          l.current_approval_stage = "hod";
        } else if (upper.includes("CURRENT_APPROVAL_STAGE = 'PRINCIPAL'")) {
          l.current_approval_stage = "principal";
        } else if (params[0]) {
          l.current_approval_stage = params[0];
        }
      }
    }
    return [{ affectedRows: l ? 1 : 0 }, []];
  }

  // DEFAULT FALLBACK
  return [[], []];
}

// Create database wrapper
let realPool = null;
let useMock = true;

if (process.env.DB_HOST && process.env.DB_HOST !== "localhost") {
  try {
    realPool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "leave_system",
      waitForConnections: true,
      connectionLimit: 5
    });
    useMock = false;
  } catch (err) {
    console.warn("⚠️ Failed to initialize MySQL pool, using mock:", err.message);
    useMock = true;
  }
}

const db = {
  query: async (sql, params) => {
    if (!useMock && realPool) {
      try {
        return await realPool.query(sql, params);
      } catch (err) {
        console.warn("⚠️ Real DB query failed, using in-memory mock:", err.message);
        useMock = true;
      }
    }
    return executeMockQuery(sql, params);
  },
  getConnection: async () => ({
    query: async (sql, params) => db.query(sql, params),
    release: () => {}
  })
};

module.exports = db;
