import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { s3Client } from '../config/storage';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Get products by category (public)
export const getProductsByCategory = async (req: Request, res: Response) => {
  let { category } = req.params;
  if (Array.isArray(category)) category = category[0]; // handle array case
  if (!category || !['banner', 'featured', 'new_arrival'].includes(category)) {
    return res.status(400).json({ message: 'Invalid category' });
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// Admin: Create product (with image upload)
export const createProduct = async (req: Request, res: Response) => {
  const { title, description, price, link, category } = req.body;
  const imageFile = req.file;

  if (!title || !category || !imageFile) {
    return res.status(400).json({ message: 'Title, category, and image are required' });
  }

  try {
    const fileExt = imageFile.originalname.split('.').pop();
    const fileName = `products/${uuidv4()}.${fileExt}`;

    const command = new PutObjectCommand({
      Bucket: process.env.BACKBLAZE_BUCKET!,
      Key: fileName,
      Body: imageFile.buffer,
      ContentType: imageFile.mimetype,
      ACL: 'public-read',
    });

    await s3Client.send(command);
    const imageUrl = `${process.env.BACKBLAZE_ENDPOINT}/${process.env.BACKBLAZE_BUCKET}/${fileName}`;

    const { data, error } = await supabase
      .from('products')
      .insert({
        title,
        description,
        image_url: imageUrl,
        price: price ? parseFloat(price) : null,
        link,
        category,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Product created', product: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create product' });
  }
};

// Admin: Update product
export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, price, link, category, is_active } = req.body;
  const imageFile = req.file;

  try {
    let imageUrl: string | undefined;
    if (imageFile) {
      const fileExt = imageFile.originalname.split('.').pop();
      const fileName = `products/${uuidv4()}.${fileExt}`;
      const command = new PutObjectCommand({
        Bucket: process.env.BACKBLAZE_BUCKET!,
        Key: fileName,
        Body: imageFile.buffer,
        ContentType: imageFile.mimetype,
        ACL: 'public-read',
      });
      await s3Client.send(command);
      imageUrl = `${process.env.BACKBLAZE_ENDPOINT}/${process.env.BACKBLAZE_BUCKET}/${fileName}`;
    }

    const updates: any = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (price) updates.price = parseFloat(price);
    if (link) updates.link = link;
    if (category) updates.category = category;
    if (is_active !== undefined) updates.is_active = is_active === 'true';
    if (imageUrl) updates.image_url = imageUrl;

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Product updated', product: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update product' });
  }
};

// Admin: Delete product
export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};