package com.project.hrm.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class FileConfig implements WebMvcConfigurer {

        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
                registry.addResourceHandler("/cv/**")
                                .addResourceLocations("file:uploads/cv/");
                registry.addResourceHandler("/api/uploads/**")
                                .addResourceLocations("file:uploads/");
                registry.addResourceHandler("/avatars/**")
                                .addResourceLocations("file:uploads/avatars/");
        }

        @Override
        public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/cv/**")
                                .allowedOrigins("http://localhost:5173")
                                .allowedMethods("GET");
                registry.addMapping("/api/uploads/**")
                                .allowedOrigins("http://localhost:5173")
                                .allowedMethods("GET");
                registry.addMapping("/avatars/**")
                                .allowedOrigins("http://localhost:5173")
                                .allowedMethods("GET");
        }
}
