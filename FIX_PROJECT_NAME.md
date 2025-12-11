# Fix Project Name Error

## Problem
Vercel project names must be **lowercase only**.

"TruScore" has uppercase letters, which caused the error.

---

## Solution

**Run the deployment again:**

```powershell
vercel --prod
```

**When asked for project name, use a LOWERCASE name:**

Good options:
- `truscore`
- `truescan-backend`
- `truescan-vercel`
- `truescan-api`

**Any lowercase name will work!**

---

## Complete Answer Sequence (Again):

```
? Set up and deploy? yes
? Which scope? [Choose your scope]
? Link to existing project? no
? What's your project's name? truscore  ← LOWERCASE!
? In which directory is your code located? ./
? Want to modify these settings? no  ← Answer NO this time!
? Do you want to change additional project settings? no
```

---

**Run `vercel --prod` again and use a lowercase project name!** 🚀












