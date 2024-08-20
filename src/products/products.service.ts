import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  logger = new Logger('ProductService');


  onModuleInit() {
    this.$connect();
    this.logger.log('Database connect');
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const totalPages = await this.product.count(
      { where: { available: true } }
    );
    const lastPage = Math.ceil(totalPages / limit);

    const products = await this.product.findMany({
      take: limit,
      skip: (page - 1) * limit,
      where: {
        available: true
      }
    });

    return {
      data: products, meta: { total: totalPages, page, lastPage }
    };
  }

  async findOne(id: number) {
    const product = await this.product.findFirst({ where: { id, available: true } });
    if (!product) {
      throw new NotFoundException(`Product not found ${id}`)
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: __, ...data } = updateProductDto;
    await this.findOne(id);
    return this.product.update({
      data: data, where: {
        id
      }
    })
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.product.update({
      where: { id },
      data: {
        available: false
      },
    })
  }
}
