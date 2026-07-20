import ProductModel, { IProduct } from "../models/Product";
import CategoryModel from "../models/Category";

export class ProductService {
  /**
   * Create a new product
   */
  static async createProduct(
    categoryId: string,
    productData: any
  ): Promise<IProduct | null> {
    try {
      const product = new ProductModel({
        categoryId,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        costPrice: productData.costPrice,
        affiliateCommissionRate: productData.affiliateCommissionRate || 0.1,
        wholesale: productData.wholesale || {
          enabled: true,
          minQuantity: 100,
          discount: 25,
        },
        dropshipping: productData.dropshipping || {
          enabled: true,
          minQuantity: 10,
          discount: 15,
        },
        bulk: productData.bulk || {
          enabled: true,
          minQuantity: 50,
          discount: 20,
        },
        image: productData.image || "",
        tags: productData.tags || [],
        stockQuantity: productData.stockQuantity || 0,
      });

      await product.save();

      // Update category product count
      await CategoryModel.findByIdAndUpdate(
        categoryId,
        { $inc: { productCount: 1 } }
      );

      return product as IProduct;
    } catch (error) {
      console.error("Error creating product:", error);
      return null;
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(
    categoryId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<IProduct[]> {
    try {
      return await ProductModel.find({ categoryId })
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }

  /**
   * Search products by name or tags
   */
  static async searchProducts(
    query: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<IProduct[]> {
    try {
      return await ProductModel.find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { tags: { $elemMatch: { $regex: query, $options: "i" } } },
        ],
      })
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error searching products:", error);
      return [];
    }
  }

  /**
   * Get wholesale products
   */
  static async getWholesaleProducts(
    limit: number = 50,
    offset: number = 0
  ): Promise<IProduct[]> {
    try {
      return await ProductModel.find({ "wholesale.enabled": true })
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error fetching wholesale products:", error);
      return [];
    }
  }

  /**
   * Get dropshipping products
   */
  static async getDropshippingProducts(
    limit: number = 50,
    offset: number = 0
  ): Promise<IProduct[]> {
    try {
      return await ProductModel.find({ "dropshipping.enabled": true })
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error fetching dropshipping products:", error);
      return [];
    }
  }

  /**
   * Get bulk products
   */
  static async getBulkProducts(
    limit: number = 50,
    offset: number = 0
  ): Promise<IProduct[]> {
    try {
      return await ProductModel.find({ "bulk.enabled": true })
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error fetching bulk products:", error);
      return [];
    }
  }

  /**
   * Get products by tags
   */
  static async getProductsByTags(
    tags: string[],
    limit: number = 50,
    offset: number = 0
  ): Promise<IProduct[]> {
    try {
      return await ProductModel.find({
        tags: { $in: tags },
      })
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error fetching products by tags:", error);
      return [];
    }
  }

  /**
   * Get product by ID with pricing based on order type
   */
  static async getProductPricing(
    productId: string,
    orderType: "retail" | "wholesale" | "dropshipping" | "bulk"
  ): Promise<any> {
    try {
      const product = await ProductModel.findById(productId);

      if (!product) return null;

      const pricing: any = {
        productId: product._id,
        name: product.name,
        retailPrice: product.price,
        costPrice: product.costPrice,
        affiliateCommissionRate: product.affiliateCommissionRate,
      };

      switch (orderType) {
        case "wholesale":
          pricing.price = product.wholesale.price;
          pricing.discount = product.wholesale.discount;
          pricing.minQuantity = product.wholesale.minQuantity;
          break;
        case "dropshipping":
          pricing.price = product.dropshipping.price;
          pricing.discount = product.dropshipping.discount;
          pricing.minQuantity = product.dropshipping.minQuantity;
          break;
        case "bulk":
          pricing.price = product.bulk.price;
          pricing.discount = product.bulk.discount;
          pricing.minQuantity = product.bulk.minQuantity;
          break;
        default:
          pricing.price = product.price;
      }

      return pricing;
    } catch (error) {
      console.error("Error getting product pricing:", error);
      return null;
    }
  }

  /**
   * Update product inventory
   */
  static async updateInventory(
    productId: string,
    quantity: number,
    action: "add" | "subtract"
  ): Promise<boolean> {
    try {
      const increment = action === "add" ? quantity : -quantity;
      await ProductModel.findByIdAndUpdate(
        productId,
        {
          $inc: { stockQuantity: increment },
        },
        { new: true }
      );

      return true;
    } catch (error) {
      console.error("Error updating inventory:", error);
      return false;
    }
  }
}
