import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { s3Client } from '../config/storage';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { ProductCategory } from '../types/enums'
import logger from '../utils/logger'

// Get products by category (public)
export const getProductsByCategory = async (req: Request, res: Response) => {
  let { category } = req.params;
  if (Array.isArray(category)) category = category[0]; // handle array case
  if (!category || !Object.values(ProductCategory).includes(category as ProductCategory)) {
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
    logger.error('Error in getProductsByCategory:', { error: err, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// Admin: Create product (with image upload)
// Banner product (title optional)
export const createBannerProduct = async (req: Request, res: Response) => {
  const { description, link } = req.body;
  const imageFile = req.file;

  if (!description || !imageFile) {
    return res.status(400).json({ message: 'Description and image are required for banner' });
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
        title: null,
        description,
        image_url: imageUrl,
        price: null,
        link: link || null,
        category: 'banner',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Banner created', product: data });
  } catch (err) {
    logger.error('Error in createBannerProduct:', err);
    res.status(500).json({ message: 'Failed to create banner' });
  }
};

// Featured product (title, price, link required)
export const createFeaturedProduct = async (req: Request, res: Response) => {
  const { title, description, price, link } = req.body;
  const imageFile = req.file;

  if (!title || !price || !link || !imageFile) {
    return res.status(400).json({ message: 'Title, price, link, and image are required for featured product' });
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
        description: description || null,
        image_url: imageUrl,
        price: parseFloat(price),
        link,
        category: 'featured',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Featured product created', product: data });
  } catch (err) {
    logger.error('Error in createFeaturedProduct:', err);
    res.status(500).json({ message: 'Failed to create featured product' });
  }
};

// New arrival product (same as featured)
export const createNewArrivalProduct = async (req: Request, res: Response) => {
  const { title, description, price, link } = req.body;
  const imageFile = req.file;

  if (!title || !price || !link || !imageFile) {
    return res.status(400).json({ message: 'Title, price, link, and image are required for new arrival' });
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
        description: description || null,
        image_url: imageUrl,
        price: parseFloat(price),
        link,
        category: 'new_arrival',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'New arrival created', product: data });
  } catch (err) {
    logger.error('Error in createNewArrivalProduct:', err);
    res.status(500).json({ message: 'Failed to create new arrival' });
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
    logger.error('Error in updateProduct:', { error: err, userId: req.user?.id });
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
    logger.error('Error in deleteProduct:', { error: err, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to delete product' });
  }
};