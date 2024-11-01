import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); 

import authenticateJWT from '../protected/authorization';

export default async function handler(req, res) {
    await authenticateJWT(req, res, async () => {
        if (req.method === "PUT") {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ error: 'Blog Post ID is required '});

            }

            const userId  = req.user.id;

            const { title, description, tags, linkToTemplates } = req.body;

            if (linkToTemplates && linkToTemplates.length > 0) {
                const templates = await prisma.template.findMany({
                    where: { id: { in: linkToTemplates } },
                });
                if (templates.length !== linkToTemplates.length) {
                    return res.status(400).json({ error: 'Template IDs do not match exisiting Templates' });
                }
            }

            const existingBlogPost = await prisma.blogPost.findUnique({
                where: { id: parseInt(id) },
            });

            if (!existingBlogPost) {
                return res.status(400).json({ error: "Blog Post Not Found"});
            }

            // generated by ChatGPT
            if (existingBlogPost.userId !== userId) {
                return res.status(403).json({ error: "You cannot edit this blog post" });
            }
            if (title && title !== existingBlogPost.title) {
                const existingTitle = await prisma.blogPost.findUnique({
                    where: { title: title },
                });

                if (existingTitle) {
                    return res.status(400).json({ error: "Title must be unique" });
                }
            }

            const blogPost = await prisma.blogPost.update({
                where: {id: parseInt(id) },
                data: {
                    title: title || existingBlogPost.title,
                    description: description || existingBlogPost.description,
                    tags: tags || existingBlogPost.tags,
                },
            });

            // generated by ChatGPT
            if (linkToTemplates) {
                await prisma.blogPostTemplate.deleteMany({
                    where: { blogPostId: blogPost.id }
                });

                await prisma.blogPostTemplate.createMany({
                    data: linkToTemplates.map(templateId => ({
                        blogPostId: blogPost.id,
                        templateId: templateId
                    })),
                });
            }

            const completeBlogPost = await prisma.blogPost.findUnique({
                where: { id: blogPost.id },
                include: { linkToTemplates: true }
            }); 

            return res.status(200).json(completeBlogPost);

        // generated by ChatGPT    
        } else if (req.method === "PATCH") {

            const { id } = req.query;

            const userId  = req.user.id;

            const { vote } = req.body;

            const existingBlogPost = await prisma.blogPost.findUnique({
                where: { id: parseInt(id) },
                include: { // generated by ChatGPT
                    upvotedByUsers: true, 
                    downvotedByUsers: true,
                }
            });

            if (!existingBlogPost) {
                return res.status(400).json({ message: "Blog Post Not Found" });
            }

            let updatedBlogPost;

            // generated by ChatGPT
            const hasUpvoted = existingBlogPost.upvotedByUsers.some(user => user.id === userId);
            const hasDownvoted = existingBlogPost.downvotedByUsers.some(user => user.id === userId);

        
            if (vote === 'upvote') {
                if (hasUpvoted) {
                    updatedBlogPost = await prisma.blogPost.update({
                        where: { id: parseInt(id) },
                        data: {
                            upvotedByUsers: {
                                disconnect: { id: userId },
                            },
                            rating: existingBlogPost.rating - 1,
                        },
                    });
                } else if (hasDownvoted) {
                    updatedBlogPost = await prisma.blogPost.update({
                        where: { id: parseInt(id) },
                        data: {
                            downvotedByUsers: {
                                disconnect: { id: userId }, 
                            },
                            upvotedByUsers: {
                                connect: { id: userId },
                            },
                            rating: existingBlogPost.rating + 2,
                        },
                    });

                } else {
                    // Generated by Chat GPT
                    updatedBlogPost = await prisma.blogPost.update({
                        where: { id: parseInt(id) },
                        data: {
                            upvotedByUsers: {
                                connect: { id: userId },
                            },

                            rating: existingBlogPost.rating + 1,
                        },
                    });
                }

            } else if (vote === 'downvote') {
                if (hasDownvoted) {
                    updatedBlogPost = await prisma.blogPost.update({
                        where: { id: parseInt(id) },
                        data: {
                            downvotedByUsers: {
                                disconnect: { id: userId },
                            },
                            rating: existingBlogPost.rating + 1,
                        },
                    });
                    
                }else if (hasUpvoted) {
                    updatedBlogPost = await prisma.blogPost.update({
                        where: { id: parseInt(id) },
                        data: {
                            upvotedByUsers: {
                                disconnect: { id: userId }, 
                            },
                            downvotedByUsers: {
                                connect: { id: userId },
                            },
                            rating: existingBlogPost.rating - 2,
                        },
                    });

                } else {
                    // Generated by Chat GPT
                    updatedBlogPost = await prisma.blogPost.update({
                        where: { id: parseInt(id) },
                        data: {
                            downvotedByUsers: {
                                connect: { id: userId },
                            },
    
                            rating: existingBlogPost.rating - 1,
                        },
                    });
                }

            } else {

                return res.status(400).json({ message: "Invalid vote type" });
            }

            // generated by ChatGPT
            updatedBlogPost = await prisma.blogPost.findUnique({
                where: { id: parseInt(id) },
                include: {
                    upvotedByUsers: true,
                    downvotedByUsers: true,
                },
            });

            return res.status(200).json(updatedBlogPost);


        } else if (req.method === "DELETE") {

            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ message: 'Blog Post ID is required '});

            }

            const userId  = req.user.id;

            const existingBlogPost = await prisma.blogPost.findUnique({
                where: { id: parseInt(id) },
            });

            if (!existingBlogPost) {
                return res.status(400).json({ message: "Blog Post Not Found"});
            }

            if (existingBlogPost.userId !== userId) {
                return res.status(403).json({ error: "You cannot delete this blog post" });
            }

            await prisma.blogPostTemplate.deleteMany({
                where: { blogPostId: existingBlogPost.id }
            });

            await prisma.blogPost.delete({
                where: { id: parseInt(id) },
            });

            return res.status(200).json({ message: "Blog Post deleted"} );


        } else {
            
            res.status(405).json({ message: "Method not allowed" });

        }
    });
}
