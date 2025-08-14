import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'admin'
    }
  })

  console.log('✅ Admin user created:', admin.email)

  // Create sample categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'technology' },
      update: {},
      create: {
        name: 'Technology',
        slug: 'technology',
        description: 'Latest tech news and tutorials'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'web-development' },
      update: {},
      create: {
        name: 'Web Development',
        slug: 'web-development',
        description: 'Web development tips and tricks'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'design' },
      update: {},
      create: {
        name: 'Design',
        slug: 'design',
        description: 'UI/UX design insights'
      }
    })
  ])

  console.log('✅ Categories created:', categories.map(c => c.name).join(', '))

  // Create sample tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { slug: 'nextjs' },
      update: {},
      create: {
        name: 'Next.js',
        slug: 'nextjs'
      }
    }),
    prisma.tag.upsert({
      where: { slug: 'react' },
      update: {},
      create: {
        name: 'React',
        slug: 'react'
      }
    }),
    prisma.tag.upsert({
      where: { slug: 'typescript' },
      update: {},
      create: {
        name: 'TypeScript',
        slug: 'typescript'
      }
    }),
    prisma.tag.upsert({
      where: { slug: 'tailwindcss' },
      update: {},
      create: {
        name: 'Tailwind CSS',
        slug: 'tailwindcss'
      }
    })
  ])

  console.log('✅ Tags created:', tags.map(t => t.name).join(', '))

  // Create sample posts
  const post1 = await prisma.post.upsert({
    where: { slug: 'welcome-to-your-new-cms' },
    update: {},
    create: {
      title: 'Welcome to Your New CMS',
      slug: 'welcome-to-your-new-cms',
      content: `
        <h2>Welcome to your new Content Management System!</h2>
        <p>This is your first blog post. You can edit or delete it from the admin panel.</p>
        <p>This CMS is built with:</p>
        <ul>
          <li><strong>Next.js 15</strong> - The React framework for production</li>
          <li><strong>TypeScript</strong> - For type-safe development</li>
          <li><strong>Tailwind CSS</strong> - For beautiful, responsive styling</li>
          <li><strong>Prisma</strong> - For database management</li>
          <li><strong>NextAuth.js</strong> - For secure authentication</li>
          <li><strong>MySQL</strong> - As the database</li>
        </ul>
        <p>Start creating amazing content!</p>
      `,
      excerpt: 'Welcome to your new CMS! Learn about the features and technologies used to build this modern content management system.',
      metaTitle: 'Welcome to Your New CMS - Getting Started',
      metaDescription: 'Learn about your new WordPress-like CMS built with Next.js, TypeScript, and modern web technologies.',
      published: true,
      featured: true,
      publishedAt: new Date(),
      authorId: admin.id
    }
  })

  // Add categories and tags to the post
  await prisma.postCategory.createMany({
    data: [
      { postId: post1.id, categoryId: categories[0].id }, // Technology
      { postId: post1.id, categoryId: categories[1].id }  // Web Development
    ],
    skipDuplicates: true
  })

  await prisma.postTag.createMany({
    data: [
      { postId: post1.id, tagId: tags[0].id }, // Next.js
      { postId: post1.id, tagId: tags[2].id }, // TypeScript
      { postId: post1.id, tagId: tags[3].id }  // Tailwind CSS
    ],
    skipDuplicates: true
  })

  const post2 = await prisma.post.upsert({
    where: { slug: 'getting-started-with-the-admin-panel' },
    update: {},
    create: {
      title: 'Getting Started with the Admin Panel',
      slug: 'getting-started-with-the-admin-panel',
      content: `
        <h2>Managing Your Content</h2>
        <p>The admin panel is your control center for managing all your content. Here's what you can do:</p>
        
        <h3>Posts Management</h3>
        <ul>
          <li>Create, edit, and delete blog posts</li>
          <li>Use the WYSIWYG editor for rich content</li>
          <li>Set SEO meta titles and descriptions</li>
          <li>Organize posts with categories and tags</li>
          <li>Control publication status and featured posts</li>
        </ul>

        <h3>Pages Management</h3>
        <ul>
          <li>Create static pages for your site</li>
          <li>Manage page content and SEO settings</li>
          <li>Control page visibility</li>
        </ul>

        <h3>Categories & Tags</h3>
        <ul>
          <li>Organize your content with categories</li>
          <li>Add tags for better content discovery</li>
          <li>View post counts for each category/tag</li>
        </ul>

        <p>Access the admin panel by clicking the "Admin" link in the navigation or visiting <code>/admin</code>.</p>
      `,
      excerpt: 'Learn how to use the admin panel to manage your posts, pages, categories, and tags effectively.',
      metaTitle: 'Getting Started with the Admin Panel - CMS Guide',
      metaDescription: 'Complete guide to using the admin panel for managing your CMS content, posts, pages, and more.',
      published: true,
      featured: false,
      publishedAt: new Date(Date.now() - 86400000), // 1 day ago
      authorId: admin.id
    }
  })

  await prisma.postCategory.createMany({
    data: [
      { postId: post2.id, categoryId: categories[1].id } // Web Development
    ],
    skipDuplicates: true
  })

  await prisma.postTag.createMany({
    data: [
      { postId: post2.id, tagId: tags[0].id } // Next.js
    ],
    skipDuplicates: true
  })

  // Create a sample page
  await prisma.page.upsert({
    where: { slug: 'about' },
    update: {},
    create: {
      title: 'About Us',
      slug: 'about',
      content: `
        <h2>About Our CMS</h2>
        <p>This is a modern, WordPress-like Content Management System built with cutting-edge web technologies.</p>
        
        <h3>Features</h3>
        <ul>
          <li>Secure admin authentication</li>
          <li>WYSIWYG content editor</li>
          <li>SEO-friendly URLs and meta tags</li>
          <li>Categories and tags system</li>
          <li>Responsive design</li>
          <li>Fast and modern architecture</li>
        </ul>

        <h3>Technology Stack</h3>
        <p>Built with Next.js, TypeScript, Tailwind CSS, Prisma, and MySQL for a robust and scalable solution.</p>
      `,
      metaTitle: 'About Us - Learn More About Our CMS',
      metaDescription: 'Learn about our modern CMS built with Next.js and the latest web technologies.',
      published: true,
      publishedAt: new Date(),
      authorId: admin.id
    }
  })

  console.log('✅ Sample posts and page created')
  console.log('🎉 Database seeded successfully!')
  console.log('\n📝 Admin Login Credentials:')
  console.log('Email: admin@example.com')
  console.log('Password: admin123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
