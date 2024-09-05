import { HttpStatus, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';

import { PaginationDto } from 'src/common';
import { RpcException } from '@nestjs/microservices';

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
      throw new RpcException({
        message: `Product not found ${id}`,
        status: HttpStatus.NOT_FOUND
      })
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

  async validate(ids: number[]) {
    ids = Array.from(new Set(ids));
    const products = await this.product.findMany({
      where: {
        id: {
          in: ids
        }
      }
    });
    if (products.length != ids.length) {
      throw new RpcException({
        message: 'Some products were not found',
        status: HttpStatus.BAD_REQUEST
      });
    }
    return products;
  }

}
