from django.db import models

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Fecha de Actualización")

    class Meta:
        abstract = True

    def clean_text_to_uppercase(self):
        ignored_fields = {'enlace', 'username', 'email', 'password', 'url', 'token'}
        for field in self._meta.fields:
            if field.name in ignored_fields:
                continue
            if isinstance(field, (models.CharField, models.TextField)):
                val = getattr(self, field.name, None)
                if isinstance(val, str) and val:
                    setattr(self, field.name, val.upper())

    def save(self, *args, **kwargs):
        self.clean_text_to_uppercase()
        super().save(*args, **kwargs)
